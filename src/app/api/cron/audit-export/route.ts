import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { runDailyAuditExport } from "@/lib/security/audit-exporter";

/**
 * GET /api/cron/audit-export
 * 
 * Secure cron endpoint (should be protected by secret or IP)
 * Triggers daily SIEM exports for all organizations with active configurations.
 */
export async function GET(req: Request) {
  const _start = Date.now();
  logger.info('cron', '➜ GET /api/cron/audit-export');

  // 1. Authorization check (e.g., QStash secret)
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 2. Fetch all organizations
    // In a high-scale environment, you might want to use a cursor or QStash fan-out
    const allOrgs = await db.select({ id: organizations.id }).from(organizations);

    const results = [];

    for (const org of allOrgs) {
      try {
        const result = await runDailyAuditExport(org.id);
        if (result) {
          results.push({ orgId: org.id, ...result });
        }
      } catch (err) {
        logger.error('cron', `✗ GET /api/cron/audit-export | Failed export for org ${org.id}`, err);
        results.push({ orgId: org.id, error: "Failed" });
      }
    }

    logger.info('cron', `✓ GET /api/cron/audit-export | 200 | ${Date.now() - _start}ms`);
    return NextResponse.json({
      success: true,
      processed: allOrgs.length,
      exports: results
    });

  } catch (error) {
    logger.error('cron', '✗ GET /api/cron/audit-export | Global Audit Export Job failed', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
