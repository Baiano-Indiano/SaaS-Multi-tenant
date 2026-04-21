import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
console.log("Connecting to:", connectionString);

const sql = postgres(connectionString!, { prepare: false, timeout: 5 });

async function test() {
  try {
    const result = await sql`SELECT 1 as connected`;
    console.log("✅ Database test result:", result);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  } finally {
    await sql.end();
  }
}

test();
