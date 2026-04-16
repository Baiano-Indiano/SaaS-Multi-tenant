import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

/**
 * Creates a dedicated PostgreSQL schema for a tenant synchronously.
 * Uses raw SQL because Drizzle's schema management APIs are config-time only.
 * Schema name is always `tenant_{uuid}` — never derived from user input.
 */
export async function createTenantSchema(tenantSchemaName: string): Promise<void> {
  // Validate format to prevent injection: must be tenant_ followed by a UUID
  const VALID_SCHEMA_PATTERN = /^tenant_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!VALID_SCHEMA_PATTERN.test(tenantSchemaName)) {
    throw new Error(`Invalid tenant schema name format: ${tenantSchemaName}`);
  }

  // Use a separate connection for DDL — avoids polluting the app connection pool
  const sql = postgres(connectionString, { prepare: false, max: 1 });

  try {
    // Idempotent — safe to call multiple times
    await sql`CREATE SCHEMA IF NOT EXISTS ${sql(tenantSchemaName)}`;
  } finally {
    await sql.end();
  }
}
