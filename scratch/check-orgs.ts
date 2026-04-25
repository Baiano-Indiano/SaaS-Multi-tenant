
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env.local") });

async function main() {
  const { db } = await import("../src/lib/db");
  const { organizations } = await import("../src/lib/db/schema");

  console.log("Checking organizations and their tenant schemas...");
  const allOrgs = await db.select().from(organizations);
  console.table(allOrgs.map(org => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    tenantSchemaName: org.tenantSchemaName
  })));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
