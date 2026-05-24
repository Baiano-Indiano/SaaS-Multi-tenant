import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { auth } from "../src/lib/auth";
import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const user = await db.select().from(users).where(eq(users.email, "bernardoneto88@gmail.com")).then(r => r[0]);
    if (!user) {
      console.error("User not found!");
      process.exit(1);
    }

    console.log("Found user:", user.id, user.email);

    // Call better-auth API directly
    const orgs = await auth.api.listOrganizations({
      headers: new Headers({
        // better-auth requires a session context or headers
      }),
      // We can also pass options if supported
    });

    console.log("better-auth listOrganizations response (no session context):", orgs);

    // Let's query organizations by session or user directly
    const userOrgs = await db.query.members.findMany({
      where: (members, { eq }) => eq(members.userId, user.id),
      with: {
        organization: true,
      },
    });

    console.log("Direct DB Query for memberships:");
    userOrgs.forEach(m => {
      console.log(`- Organization Name: ${m.organization.name}, Slug: ${m.organization.slug}, Role: ${m.role}`);
    });

  } catch (e) {
    console.error("Failed:", e);
  }
  process.exit(0);
}

run();
