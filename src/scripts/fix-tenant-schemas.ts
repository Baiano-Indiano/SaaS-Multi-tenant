import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false });

async function fixTenantSchemas() {
  console.log("🔍 Fetching all tenant schemas...");
  
  try {
    const orgs = await sql`
      SELECT id, name, "tenantSchemaName" 
      FROM organization 
      WHERE "tenantSchemaName" IS NOT NULL AND "tenantSchemaName" != ''
    `;

    console.log(`✅ Found ${orgs.length} organizations to check.`);

    for (const org of orgs) {
      console.log(`\n📦 Checking organization: ${org.name} (${org.tenantSchemaName})...`);
      
      try {
        // Use a simpler approach: ALTER TABLE ADD COLUMN IF NOT EXISTS
        // We use sql() helper for the table identifier to ensure correct escaping
        await sql.unsafe(`
          ALTER TABLE ${org.tenantSchemaName}.role 
          ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
        `);
        
        console.log(`✨ Processed ${org.tenantSchemaName} successfully.`);
      } catch (err) {
        console.error(`❌ Failed to process ${org.tenantSchemaName}:`, err);
      }
    }

  } catch (err) {
    console.error("❌ Error fetching organizations:", err);
  } finally {
    await sql.end();
    console.log("\n🏁 Maintenance script finished.");
  }
}

fixTenantSchemas();
