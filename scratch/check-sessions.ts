import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../src/lib/db";
import { sessions, users } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const s = await db.select().from(sessions);
    console.log("Active Sessions:");
    for (const sess of s) {
      const u = await db.select().from(users).where(eq(users.id, sess.userId)).then(r => r[0]);
      console.log(`- Session ID: ${sess.id}\n  User: ${u?.email}\n  Active Org ID: ${(sess as any).activeOrganizationId}\n  Expires At: ${sess.expiresAt}`);
    }
  } catch (e) {
    console.error("Failed to query sessions:", e);
  }
  process.exit(0);
}

run();
