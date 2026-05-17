
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
async function check() {
  const { db } = await import("./index");
  const { organizations, projects } = await import("./schema");
  const { withAdminTenantDb } = await import("./tenant-db");
  const { count } = await import("drizzle-orm");

  const orgs = await db.select().from(organizations);
  console.log("Organizations:", orgs.map(o => ({ id: o.id, name: o.name, schema: o.tenantSchemaName })));

  for (const org of orgs) {
    try {
      const pCount = await withAdminTenantDb(org.id, (tx) => 
        tx.select({ value: count() }).from(projects)
      );
      console.log(`Org ${org.name} (${org.id}) projects:`, pCount[0].value);
    } catch (e) {
      console.log(`Org ${org.name} (${org.id}) error:`, e instanceof Error ? e.message : e);
    }
  }
  process.exit(0);
}

check();
