import { db } from "../lib/db";
import * as schema from "../lib/db/schema";

async function main() {
  console.log("--- Debugging Organizations ---");
  const orgs = await db.select().from(schema.organizations);
  console.log(`Found ${orgs.length} organizations:`);
  console.table(orgs.map(o => ({ id: o.id, name: o.name, slug: o.slug, tenantSchemaName: o.tenantSchemaName })));

  console.log("\n--- Debugging Members ---");
  const members = await db.select().from(schema.members);
  console.log(`Found ${members.length} members:`);
  console.table(members.map(m => ({ id: m.id, organizationId: m.organizationId, userId: m.userId, role: m.role })));

  console.log("\n--- Debugging Users ---");
  const users = await db.select().from(schema.users);
  console.log(`Found ${users.length} users:`);
  console.table(users.map(u => ({ id: u.id, name: u.name, email: u.email })));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
