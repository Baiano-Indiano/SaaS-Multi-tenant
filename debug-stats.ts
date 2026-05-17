
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function debug() {
  const { db } = await import("./src/lib/db/index");
  const { organizations } = await import("./src/lib/db/schema");
  const { getDashboardStats } = await import("./src/lib/api/stats");

  const orgs = await db.select().from(organizations);
  for (const org of orgs) {
    const stats = await getDashboardStats(org.id);
    console.log(`Org: ${org.name} (${org.id})`);
    console.log(`Stats:`, JSON.stringify(stats, null, 2));
  }
  process.exit(0);
}

debug();
