import postgres from 'postgres';
import { DEFAULT_ADMIN_PERMISSIONS, DEFAULT_MEMBER_PERMISSIONS } from '../auth/permissions';

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/saas_db";

/**
 * Creates a dedicated PostgreSQL schema for a tenant synchronously.
 * Uses raw SQL because Drizzle's schema management APIs are config-time only.
 * Schema name is always `tenant_{uuid}` — never derived from user input.
 */
export async function createTenantSchema(tenantSchemaName: string): Promise<{ adminRoleId: string } | void> {
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

    // Create Tables inside the schema
    await sql`
      CREATE TABLE IF NOT EXISTS ${sql(tenantSchemaName)}.role (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ${sql(tenantSchemaName)}.role_permission (
        "roleId" TEXT NOT NULL REFERENCES ${sql(tenantSchemaName)}.role(id) ON DELETE CASCADE,
        "permissionKey" TEXT NOT NULL,
        PRIMARY KEY ("roleId", "permissionKey")
      );
    `;

    // Check if default roles exist
    const roles = await sql`SELECT id FROM ${sql(tenantSchemaName)}.role LIMIT 1`;
    
    if (roles.length === 0) {
      const adminRoleId = crypto.randomUUID();
      const memberRoleId = crypto.randomUUID();
      const viewerRoleId = crypto.randomUUID();

      // Insert Administrator Role
      await sql`
        INSERT INTO ${sql(tenantSchemaName)}.role (id, name, slug, description)
        VALUES (${adminRoleId}, 'Administrator', 'administrator', 'Full access to all organization resources')
      `;

      // Insert permissions for Admin
      for (const p of DEFAULT_ADMIN_PERMISSIONS) {
        await sql`
          INSERT INTO ${sql(tenantSchemaName)}.role_permission ("roleId", "permissionKey")
          VALUES (${adminRoleId}, ${p})
        `;
      }

      // Insert Member Role
      await sql`
        INSERT INTO ${sql(tenantSchemaName)}.role (id, name, slug, description)
        VALUES (${memberRoleId}, 'Member', 'member', 'Standard access to organization resources')
      `;

      // Insert permissions for Member
      for (const p of DEFAULT_MEMBER_PERMISSIONS) {
        await sql`
          INSERT INTO ${sql(tenantSchemaName)}.role_permission ("roleId", "permissionKey")
          VALUES (${memberRoleId}, ${p})
        `;
      }

      // Insert Viewer Role
      await sql`
        INSERT INTO ${sql(tenantSchemaName)}.role (id, name, slug, description)
        VALUES (${viewerRoleId}, 'Viewer', 'viewer', 'Read-only access')
      `;

      // Insert permissions for Viewer (from permissions.ts)
      // Note: We need DEFAULT_VIEWER_PERMISSIONS imported
      const { DEFAULT_VIEWER_PERMISSIONS } = await import('../auth/permissions');
      for (const p of DEFAULT_VIEWER_PERMISSIONS) {
        await sql`
          INSERT INTO ${sql(tenantSchemaName)}.role_permission ("roleId", "permissionKey")
          VALUES (${viewerRoleId}, ${p})
        `;
      }

      return { adminRoleId };
    }
    
    // If roles already exist, find the administrator id
    const adminRole = await sql`SELECT id FROM ${sql(tenantSchemaName)}.role WHERE slug = 'administrator' LIMIT 1`;
    return { adminRoleId: adminRole[0]?.id };
  } finally {
    await sql.end();
  }
}

