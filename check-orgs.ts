
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./src/lib/db";
import { organizations } from "./src/lib/db/schema";

async function check() {
  try {
    const allOrgs = await db.select().from(organizations);
    console.log("Organizations and their schemas:");
    allOrgs.forEach(org => {
      console.log(`- ID: ${org.id}, Name: ${org.name}, Slug: ${org.slug}, Schema: ${org.tenantSchemaName}`);
    });
  } catch (e) {
    console.error("Query failed:", e);
  }
  process.exit(0);
}

check();
