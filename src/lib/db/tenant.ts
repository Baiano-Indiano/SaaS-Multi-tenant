import postgres from 'postgres';
import { DEFAULT_ADMIN_PERMISSIONS, DEFAULT_MEMBER_PERMISSIONS } from '../auth/permissions';

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/saas_db";

/**
 * Creates a dedicated PostgreSQL schema for a tenant synchronously.
 * Uses raw SQL because Drizzle's schema management APIs are config-time only.
 * Schema name is always `tenant_{uuid}` — never derived from user input.
 */
export async function createTenantSchema(tenantSchemaName: string): Promise<{ adminRoleId: string } | void> {
  const normalizedSchemaName = tenantSchemaName.toLowerCase();
  // Validate format to prevent injection: must be tenant_ followed by alphanumeric characters (including Nanoids)
  const VALID_SCHEMA_PATTERN = /^tenant_[a-z0-9_-]+$/;
  if (!VALID_SCHEMA_PATTERN.test(normalizedSchemaName)) {
    throw new Error(`Invalid tenant schema name format: ${tenantSchemaName}`);
  }

  // Use the normalized name for all subsequent operations
  const schemaName = normalizedSchemaName;

  // Use a separate connection for DDL — avoids polluting the app connection pool
  const sql = postgres(connectionString, { prepare: false, max: 1 });

  try {
    // Idempotent — safe to call multiple times
    await sql`CREATE SCHEMA IF NOT EXISTS ${sql(schemaName)}`;

    // Create Tables inside the schema
    await sql`
      CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.role (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.role_permission (
        "roleId" TEXT NOT NULL REFERENCES ${sql(schemaName)}.role(id) ON DELETE CASCADE,
        "permissionKey" TEXT NOT NULL,
        PRIMARY KEY ("roleId", "permissionKey")
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.project (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        "userId" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.api_key (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        "keyHash" TEXT NOT NULL UNIQUE,
        "keyPrefix" TEXT NOT NULL,
        "roleId" TEXT NOT NULL,
        "lastUsedAt" TIMESTAMP,
        "expiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.webhook (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        secret TEXT NOT NULL,
        events TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.workflow (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        trigger TEXT NOT NULL,
        "actionType" TEXT NOT NULL DEFAULT 'webhook',
        "actionConfig" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ${sql(schemaName)}.webhook_delivery (
        id TEXT PRIMARY KEY,
        "webhookId" TEXT REFERENCES ${sql(schemaName)}.webhook(id) ON DELETE CASCADE,
        "workflowId" TEXT REFERENCES ${sql(schemaName)}.workflow(id) ON DELETE CASCADE,
        "eventType" TEXT NOT NULL,
        payload TEXT NOT NULL,
        "responseStatus" TEXT,
        "responseBody" TEXT,
        duration TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // Check if default roles exist
    const roles = await sql`SELECT id FROM ${sql(schemaName)}.role LIMIT 1`;
    
    if (roles.length === 0) {
      const adminRoleId = crypto.randomUUID();
      const memberRoleId = crypto.randomUUID();
      const viewerRoleId = crypto.randomUUID();

      // Insert Administrator Role
      await sql`
        INSERT INTO ${sql(schemaName)}.role (id, name, slug, description)
        VALUES (${adminRoleId}, 'Administrator', 'administrator', 'Full access to all organization resources')
      `;

      // Insert permissions for Admin
      for (const p of DEFAULT_ADMIN_PERMISSIONS) {
        await sql`
          INSERT INTO ${sql(schemaName)}.role_permission ("roleId", "permissionKey")
          VALUES (${adminRoleId}, ${p})
        `;
      }

      // Insert Member Role
      await sql`
        INSERT INTO ${sql(schemaName)}.role (id, name, slug, description)
        VALUES (${memberRoleId}, 'Member', 'member', 'Standard access to organization resources')
      `;

      // Insert permissions for Member
      for (const p of DEFAULT_MEMBER_PERMISSIONS) {
        await sql`
          INSERT INTO ${sql(schemaName)}.role_permission ("roleId", "permissionKey")
          VALUES (${memberRoleId}, ${p})
        `;
      }

      // Insert Viewer Role
      await sql`
        INSERT INTO ${sql(schemaName)}.role (id, name, slug, description)
        VALUES (${viewerRoleId}, 'Viewer', 'viewer', 'Read-only access')
      `;

      // Insert permissions for Viewer (from permissions.ts)
      // Note: We need DEFAULT_VIEWER_PERMISSIONS imported
      const { DEFAULT_VIEWER_PERMISSIONS } = await import('../auth/permissions');
      for (const p of DEFAULT_VIEWER_PERMISSIONS) {
        await sql`
          INSERT INTO ${sql(schemaName)}.role_permission ("roleId", "permissionKey")
          VALUES (${viewerRoleId}, ${p})
        `;
      }

      return { adminRoleId };
    }
    
    // If roles already exist, find the administrator id
    const adminRole = await sql`SELECT id FROM ${sql(schemaName)}.role WHERE slug = 'administrator' LIMIT 1`;
    return { adminRoleId: adminRole[0]?.id };
  } finally {
    await sql.end();
  }
}

