
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env.local") });

async function main() {
  const { db } = await import("../src/lib/db");
  const { sql } = await import("drizzle-orm");

  console.log("Normalizing existing tenant schema names to lowercase...");
  
  // Update all organizations to have lowercase tenantSchemaName
  await db.execute(sql`
    UPDATE organization 
    SET "tenantSchemaName" = LOWER("tenantSchemaName") 
    WHERE "tenantSchemaName" IS NOT NULL
  `);

  console.log("Normalization complete.");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
