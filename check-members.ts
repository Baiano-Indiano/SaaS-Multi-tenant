
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const { db } = require("./src/lib/db");
import { members, organizations, users } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function check() {
  try {
    console.log("DATABASE_URL found:", process.env.DATABASE_URL ? "Yes (starts with " + process.env.DATABASE_URL.substring(0, 10) + "...)" : "No");
    const allUsers = await db.select().from(users);
    console.log("Users:");
    allUsers.forEach(u => console.log(`- ${u.id}: ${u.email}`));

    const allMembers = await db.select().from(members);
    console.log("\nMemberships:");
    for (const m of allMembers) {
      const org = await db.select().from(organizations).where(eq(organizations.id, m.organizationId)).then(r => r[0]);
      const user = await db.select().from(users).where(eq(users.id, m.userId)).then(r => r[0]);
      console.log(`- User: ${user?.email}, Org: ${org?.name} (${org?.slug}), Role: ${m.role}`);
    }
  } catch (e) {
    console.error("Query failed:", e);
  }
  process.exit(0);
}

check();
