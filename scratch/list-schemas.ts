
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env.local") });

async function main() {
  const { db } = await import("../src/lib/db");
  const { sql } = await import("drizzle-orm");

  console.log("Checking existing schemas in database...");
  const schemas = await db.execute(sql`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
  `);
  
  console.log("Found tenant schemas:");
  console.table(schemas);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
