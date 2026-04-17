import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const connectionString = process.env.DATABASE_URL!;

async function test() {
  console.log("Testing connection to:", connectionString);
  const sql = postgres(connectionString, { prepare: false });
  try {
    const result = await sql`SELECT version()`;
    console.log("Success!", result[0]);
  } catch (e) {
    console.error("Connection failed:", e);
  } finally {
    await sql.end();
  }
}
test();
