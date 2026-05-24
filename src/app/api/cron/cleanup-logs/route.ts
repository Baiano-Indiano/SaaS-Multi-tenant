import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { withAdminTenantDb } from "@/lib/db/tenant-db";
import { cleanupAuditLogs } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/cleanup-logs
 * 
 * Vercel Cron job to purge audit logs older than 90 days across all tenants.
 * Secured via CRON_SECRET environment variable.
 */
export async function GET(request: Request) {
  const _start = Date.now();
  logger.info('cron', '➜ GET /api/cron/cleanup-logs');
  const authHeader = request.headers.get("authorization");
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 1. Fetch all active organizations with a tenant schema
    const allOrgs = await db.query.organizations.findMany({
      columns: {
        id: true,
        tenantSchemaName: true,
      }
    });

    const results = {
      total: allOrgs.length,
      success: 0,
      failed: 0,
      errors: [] as { orgId: string; error: string }[],
    };

    // 2. Iterate and cleanup logs for each tenant
    for (const org of allOrgs) {
      if (!org.tenantSchemaName) continue;

      try {
        await withAdminTenantDb(org.id, async (tx) => {
          await cleanupAuditLogs(tx);
        });
        results.success++;
      } catch (error) {
        logger.error('cron', `✗ GET /api/cron/cleanup-logs | Cleanup failed for Org ${org.id}`, error);
        results.failed++;
        results.errors.push({ 
          orgId: org.id, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    logger.info('cron', `✓ GET /api/cron/cleanup-logs | 200 | ${Date.now() - _start}ms`);
    return NextResponse.json({ 
      message: "Audit log cleanup completed",
      ...results
    });

  } catch (error) {
    logger.error('cron', '✗ GET /api/cron/cleanup-logs | Global cleanup error', error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
