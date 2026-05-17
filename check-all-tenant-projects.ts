
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "./src/lib/db/index";
import { sql } from "drizzle-orm";

async function run() {
  try {
    const schemas = await db.execute(sql`SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'`);
    for (const schema of (schemas as unknown as { schema_name: string }[])) {
      try {
        const schemaName = schema.schema_name;
        // Use direct SQL to count projects in this schema
        const query = sql.raw(`SELECT count(*) FROM "${schemaName}".projects`);
        const result = await db.execute(query);
        const countValue = (result as unknown as { count: string | number }[])[0].count;
        console.log(`Schema ${schemaName}: ${countValue} projects`);
      } catch (e) {
        console.error(`Error checking schema ${schema.schema_name}:`, e);
      }
    }
  } catch (err) {
    console.error("Failed to list schemas:", err);
  }
  process.exit(0);
}

run();
