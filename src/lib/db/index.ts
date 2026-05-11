import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/saas_db";
const readConnectionString = process.env.READ_DATABASE_URL || connectionString;
const hasDistinctReplica = readConnectionString !== connectionString;

/* eslint-disable @typescript-eslint/no-explicit-any */
type TPostgresSql = Record<string, postgres.PostgresType<any>>;

// Pooling options
const clientOptions: postgres.Options<TPostgresSql> = {
  prepare: false,
  max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 10,
  idle_timeout: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT) : 20,
};

// Singleton clients for Primary and Read Replicas
let primaryClient: postgres.Sql<TPostgresSql>;
let readClient: postgres.Sql<TPostgresSql>;

if (process.env.NODE_ENV !== 'production') {
  const globalRegistry = globalThis as unknown as { 
    __db_primary?: postgres.Sql<TPostgresSql>;
    __db_read?: postgres.Sql<TPostgresSql>;
  };
  
  if (!globalRegistry.__db_primary) {
    globalRegistry.__db_primary = postgres(connectionString, clientOptions);
  }
  if (!globalRegistry.__db_read) {
    globalRegistry.__db_read = hasDistinctReplica
      ? postgres(readConnectionString, clientOptions)
      : globalRegistry.__db_primary;
  }
  
  primaryClient = globalRegistry.__db_primary;
  readClient = globalRegistry.__db_read;
} else {
  primaryClient = postgres(connectionString, clientOptions);
  readClient = hasDistinctReplica
    ? postgres(readConnectionString, clientOptions)
    : primaryClient;
}

// Export Primary DB (Read/Write)
export const db = drizzle(primaryClient, { schema });

// Internal read replica Drizzle instance
const _readDb = drizzle(readClient, { schema });

// ---------------------------------------------------------------------------
// Circuit Breaker (Lite) for Read Replica
//
// Tracks consecutive failures on the read replica. After THRESHOLD failures,
// the breaker "opens" and routes all reads to the primary for RECOVERY_MS.
// After that window, it tries the replica again (half-open state).
// ---------------------------------------------------------------------------
const CB_THRESHOLD = 3;
const CB_RECOVERY_MS = 60_000; // 1 minute

let cbFailures = 0;
let cbOpenSince: number | null = null;

function isCircuitOpen(): boolean {
  if (!hasDistinctReplica) return true; // No separate replica — always use primary
  if (cbOpenSince === null) return false;
  if (Date.now() - cbOpenSince >= CB_RECOVERY_MS) {
    // Half-open: allow one probe
    cbOpenSince = null;
    cbFailures = 0;
    return false;
  }
  return true;
}

function recordReplicaSuccess() {
  cbFailures = 0;
  cbOpenSince = null;
}

function recordReplicaFailure() {
  cbFailures++;
  if (cbFailures >= CB_THRESHOLD) {
    cbOpenSince = Date.now();
    console.warn(`[DB Circuit Breaker] Read replica marked UNHEALTHY after ${CB_THRESHOLD} consecutive failures. Falling back to primary for ${CB_RECOVERY_MS / 1000}s.`);
  }
}

/**
 * Proxy-based readDb that intercepts .transaction() calls to apply the circuit breaker.
 * When the circuit is open, queries transparently route to the primary DB.
 */
export const readDb = new Proxy(_readDb, {
  get(target, prop, receiver) {
    if (prop === 'transaction') {
      return async (...args: Parameters<typeof target.transaction>) => {
        if (isCircuitOpen()) {
          return db.transaction(...args);
        }
        try {
          const result = await target.transaction(...args);
          recordReplicaSuccess();
          return result;
        } catch (error) {
          recordReplicaFailure();
          // Fallback to primary for this request
          console.warn('[DB Circuit Breaker] Read replica query failed, retrying on primary.');
          return db.transaction(...args);
        }
      };
    }

    if (prop === 'query') {
      // For relational queries, route based on circuit state
      if (isCircuitOpen()) {
        return db.query;
      }
      return Reflect.get(target, prop, receiver);
    }

    // For all other Drizzle methods (select, etc.), route based on circuit state
    if (isCircuitOpen()) {
      return Reflect.get(db, prop, receiver);
    }
    return Reflect.get(target, prop, receiver);
  },
});
