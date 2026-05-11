import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local (dev) or .env (prod)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

async function migrate() {
  console.log("🚀 Starting tenant schema migration...");
  
  // Dynamic import ensures env vars are loaded first
  const { db } = await import("../lib/db");
  const { organizations } = await import("../lib/db/schema");
  const { createTenantSchema } = await import("../lib/db/tenant");
  
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

migrate().catch(err => {
  console.error("Fatal migration error:", err);
  process.exit(1);
});
