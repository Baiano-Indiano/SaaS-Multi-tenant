import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../src/lib/db";
import { sessions, users } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const user = await db.select().from(users).where(eq(users.email, "bernardoneto88@gmail.com")).then(r => r[0]);
    if (!user) {
      console.error("User not found!");
      process.exit(1);
    }
    const userSessions = await db.select().from(sessions).where(eq(sessions.userId, user.id));
    console.log("Sessions for", user.email);
    userSessions.forEach(s => {
      console.log({
        id: s.id,
        token: s.token,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt
      });
    });
  } catch (e) {
    console.error("Failed:", e);
  }
  process.exit(0);
}

run();
