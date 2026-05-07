import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { redis } from "@/lib/redis";

/**
 * GET /api/v1/health
 * 
 * Secure binary health check endpoint.
 * Verifies application availability and connectivity to critical infrastructure (DB & Redis).
 * Optimized for status pages and monitoring tools.
 */
export async function GET() {
  const status = {
    database: "DOWN",
    cache: "DOWN",
    timestamp: new Date().toISOString()
  };

  try {
    // 1. Verify Database Connectivity (Simple SELECT 1)
    await db.execute(sql`SELECT 1`);
    status.database = "UP";

    // 2. Verify Redis Connectivity (Ping)
    // Redis is on the critical path for auth and rate limiting
    await redis.ping();
    status.cache = "UP";

    // Check if everything is UP
    const isHealthy = status.database === "UP" && status.cache === "UP";

    return NextResponse.json(
      { 
        status: isHealthy ? "UP" : "DEGRADED", 
        ...status
      }, 
      { status: isHealthy ? 200 : 503 }
    );
  } catch (error) {
    console.error("[Health Check] Infrastructure failure:", error);
    
    return NextResponse.json(
      { 
        status: "DOWN", 
        ...status
      }, 
      { status: 503 }
    );
  }
}
