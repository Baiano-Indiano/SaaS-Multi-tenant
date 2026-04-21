import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, { prepare: false });

/**
 * TENANT_DDL
 * 
 * Defines the tables that MUST exist in every tenant schema.
 * Note: Decoupled from public schema (Rule 3).
 */
const GET_TENANT_DDL = (schemaName: string) => [
  // 1. Role Table
  `CREATE TABLE IF NOT EXISTS ${schemaName}.role (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,

  // 2. Role Permission Table
  `CREATE TABLE IF NOT EXISTS ${schemaName}.role_permission (
    "roleId" TEXT NOT NULL REFERENCES ${schemaName}.role(id) ON DELETE CASCADE,
    "permissionKey" TEXT NOT NULL,
    PRIMARY KEY ("roleId", "permissionKey")
  )`,

  // 3. Projects Table (New Business Table)
  `CREATE TABLE IF NOT EXISTS ${schemaName}.project (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`,

  // 4. Audit Log Table
  `CREATE TABLE IF NOT EXISTS ${schemaName}.audit_log (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    action TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    details TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
  )`
];

async function migrateTenants() {
  console.log("🚀 Starting Cross-Tenant Migration Engine...");

  try {
    // 1. Fetch all tenant schemas from public.organization
    const orgs = await sql`
      SELECT id, name, "tenantSchemaName" 
      FROM organization 
      WHERE "tenantSchemaName" IS NOT NULL AND "tenantSchemaName" != ''
    `;

    console.log(`📡 Found ${orgs.length} tenants to synchronize.`);

    for (const org of orgs) {
      const schema = org.tenantSchemaName;
      console.log(`\n📦 Migrating Tenant: ${org.name} [${schema}]...`);

      try {
        // Ensure schema exists
        await sql`CREATE SCHEMA IF NOT EXISTS ${sql(schema)}`;

        // Apply DDL one by one
        const queries = GET_TENANT_DDL(schema);
        for (const query of queries) {
          await sql.unsafe(query);
        }

        console.log(`✅ ${schema} is up to date.`);
      } catch (err) {
        console.error(`❌ Failed to migrate ${schema}:`, err);
      }
    }

    console.log("\n✨ All-Schemas migration completed successfully.");
  } catch (err) {
    console.error("💥 Critical error during migration:", err);
  } finally {
    await sql.end();
  }
}

migrateTenants();
