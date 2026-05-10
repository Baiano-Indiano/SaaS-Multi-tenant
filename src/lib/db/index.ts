import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/saas_db";
const readConnectionString = process.env.READ_DATABASE_URL || connectionString;

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
    globalRegistry.__db_read = readConnectionString === connectionString 
      ? globalRegistry.__db_primary 
      : postgres(readConnectionString, clientOptions);
  }
  
  primaryClient = globalRegistry.__db_primary;
  readClient = globalRegistry.__db_read;
} else {
  primaryClient = postgres(connectionString, clientOptions);
  readClient = readConnectionString === connectionString 
    ? primaryClient 
    : postgres(readConnectionString, clientOptions);
}

// Export Primary DB (Read/Write)
export const db = drizzle(primaryClient, { schema });

// Export Read-Only DB (Replica)
export const readDb = drizzle(readClient, { schema });

