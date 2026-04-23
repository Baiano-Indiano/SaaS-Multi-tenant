
import { db } from "../src/lib/db";
import { users, organizations } from "../src/lib/db/schema";

async function main() {
  try {
    const allUsers = await db.select().from(users);
    const allOrgs = await db.select().from(organizations);

    console.log("Users:", JSON.stringify(allUsers, null, 2));
    console.log("Organizations:", JSON.stringify(allOrgs, null, 2));
  } catch (err) {
    console.error("Database query failed:", err);
  }
}

main().catch(console.error);
