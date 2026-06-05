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

    // Get all sessions
    const userSessList = await db.select()
      .from(sessions)
      .where(eq(sessions.userId, user.id))
      .orderBy(desc(sessions.expiresAt));

    for (const s of userSessList) {
      console.log(`Checking session: id=${s.id}, expiresAt=${s.expiresAt}`);
      const headers = new Headers();
      headers.set("Cookie", `better-auth.session_token=${s.token}`);
      
      try {
        const sessionRes = await auth.api.getSession({
          headers,
        });
        console.log(`- getSession result:`, sessionRes ? `Success (User: ${sessionRes.user.email})` : "Null");
      } catch (e) {
        console.log(`- getSession error:`, e);
      }
    }

  } catch (e) {
    console.error("Failed:", e);
  }
  process.exit(0);
}

run();
