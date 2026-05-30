import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { runSequentialMigrations } from "@/lib/db/migration-orchestrator";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/migrations-worker
 * 
 * Vercel Cron/QStash worker endpoint.
 * Sequentially triggers migration sweeps across all tenant schemas.
 */
export async function GET(request: Request) {
  const _start = Date.now();
  logger.info("cron", "➜ GET /api/cron/migrations-worker");
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn("cron", "Unauthorized migrations-worker cron attempt");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const results = await runSequentialMigrations(10);
    
    logger.info(
      "cron", 
      `✓ GET /api/cron/migrations-worker | 200 | ${Date.now() - _start}ms | Processed: ${results.processed}/${results.total}`
    );
    
    return NextResponse.json({
      message: "Sequential schema migrations complete",
      ...results,
    });
  } catch (error) {
    logger.error("cron", "✗ GET /api/cron/migrations-worker | Global error", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
