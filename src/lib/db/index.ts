import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/saas_db";

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  console.warn('⚠️ DATABASE_URL is not set. Database operations will fail.');
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const clientOptions: postgres.Options<{}> = {
  prepare: false,
  max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 10,
  idle_timeout: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT) : 20,
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
let client: postgres.Sql<{}>;

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  const globalRegistry = globalThis as unknown as { __db_client?: postgres.Sql<{}> };
  if (!globalRegistry.__db_client) {
    globalRegistry.__db_client = postgres(connectionString, clientOptions);
  }
  client = globalRegistry.__db_client!;
} else {
  client = postgres(connectionString, clientOptions);
}

export const db = drizzle(client, { schema });
