import "dotenv/config";
import { db } from "../lib/db";
import { organizations } from "../lib/db/schema";
import { createTenantSchema } from "../lib/db/tenant";

async function migrate() {
  console.log("🚀 Starting tenant schema migration...");
  
  const allOrgs = await db.select().from(organizations);
  
  for (const org of allOrgs) {
    if (org.tenantSchemaName) {
      console.log(`Migrating schema for ${org.name} (${org.tenantSchemaName})...`);
      try {
        await createTenantSchema(org.tenantSchemaName);
        console.log(`✅ Success for ${org.name}`);
      } catch (error) {
        console.error(`❌ Failed for ${org.name}:`, error);
      }
    }
  }
  
  console.log("🏁 Migration complete.");
  process.exit(0);
}

migrate();
