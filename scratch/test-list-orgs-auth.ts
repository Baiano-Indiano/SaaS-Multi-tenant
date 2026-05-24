import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { auth } from "../src/lib/auth";
import { db } from "../src/lib/db";
import { users, sessions } from "../src/lib/db/schema";
import { eq, desc } from "drizzle-orm";

async function run() {
  try {
    const user = await db.select().from(users).where(eq(users.email, "bernardoneto88@gmail.com")).then(r => r[0]);
    if (!user) {
      console.error("User not found!");
      process.exit(1);
    }

    console.log("Found user:", user.id, user.email);

    // Get the latest active session for this user
    const userSession = await db.select()
      .from(sessions)
      .where(eq(sessions.userId, user.id))
      .orderBy(desc(sessions.expiresAt))
      .limit(1)
      .then(r => r[0]);

    if (!userSession) {
      console.error("No session found for user!");
      process.exit(1);
    }

    console.log("Using session token:", userSession.token);

    // Call better-auth API directly with headers containing the cookie
    const headers = new Headers();
    headers.set("Cookie", `better-auth.session_token=${userSession.token}`);
    
    const orgs = await auth.api.listOrganizations({
      headers,
    });

    console.log("better-auth listOrganizations response:", JSON.stringify(orgs, null, 2));

  } catch (e) {
    console.error("Failed:", e);
  }
  process.exit(0);
}

run();
