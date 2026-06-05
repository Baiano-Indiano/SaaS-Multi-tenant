import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { organizations, auditLogs } from "@/lib/db/schema";
import { withAdminTenantDb } from "@/lib/db/tenant-db";
import { recordAuditLog } from "@/lib/audit";
import { lt, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const SAFE_SCHEMA_REGEX = /^tenant_[a-zA-Z0-9_]+$/;

/**
 * GET /api/cron/cleanup-logs
 * 
 * Vercel Cron/QStash task.
 * Automatically runs a physical cleanup (Hard Delete) of audit logs
 * based on each organization's configured dataRetentionDays.
 */
export async function GET(request: Request) {
  const _start = Date.now();
  logger.info("cron", "➜ GET /api/cron/cleanup-logs");
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn("cron", "Unauthorized cleanup-logs cron attempt");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 1. Fetch all organizations with data retention configured
    const orgs = await db.select({
      id: organizations.id,
      slug: organizations.slug,
      tenantSchemaName: organizations.tenantSchemaName,
      dataRetentionDays: organizations.dataRetentionDays,
    })
    .from(organizations)
    .where(
      sql`${organizations.dataRetentionDays} IS NOT NULL AND ${organizations.dataRetentionDays} > 0`
    );

    logger.info("cron", `Found ${orgs.length} organization(s) with retention policy active`);

    const results = {
      processed: 0,
      cleared: 0,
      failed: 0,
      details: [] as { 
        orgId: string; 
        schema: string; 
        deletedCount: number; 
        status: "success" | "skipped" | "error"; 
        error?: string 
      }[],
    };

    // 2. Loop through organizations and perform the sweep
    for (const org of orgs) {
      results.processed++;
      const schemaName = org.tenantSchemaName;
      const retentionDays = org.dataRetentionDays!;

      if (!schemaName) {
        logger.warn("cron", `Organization ${org.id} does not have a tenant schema name configured. Skipping.`);
        results.details.push({
          orgId: org.id,
          schema: "",
          deletedCount: 0,
          status: "skipped",
          error: "No tenant schema name configured",
        });
        continue;
      }

      if (!SAFE_SCHEMA_REGEX.test(schemaName)) {
        logger.error("cron", `Security Alert: Invalid tenant schema name "${schemaName}" for Org ${org.id}`);
        results.failed++;
        results.details.push({
          orgId: org.id,
          schema: schemaName,
          deletedCount: 0,
          status: "error",
          error: "Invalid tenant schema name format",
        });
        continue;
      }

      try {
        const deletedCount = await withAdminTenantDb(org.id, async (tx) => {
          // Perform hard delete of audit logs older than retentionDays
          const deleted = await tx.delete(auditLogs)
            .where(
              lt(
                auditLogs.createdAt, 
                sql`NOW() - CAST(${retentionDays} || ' days' AS INTERVAL)`
              )
            )
            .returning({ id: auditLogs.id });
            
          return deleted.length;
        });

        logger.info("cron", `Purged ${deletedCount} logs for organization ${org.id} (${schemaName})`);
        
        // Write audit log entry in tenant schema if any rows were deleted
        if (deletedCount > 0) {
          await recordAuditLog({
            organizationId: org.id,
            action: "AUDIT_LOGS_PURGED",
            entityType: "ORGANIZATION",
            entityId: org.id,
            details: {
              purgedCount: deletedCount,
              retentionDays,
              message: `Logs de auditoria com mais de ${retentionDays} dias foram removidos fisicamente.`
            },
            actor: {
              id: "system",
              name: "System Cron",
              email: "system@saas-starter.internal",
            }
          });
        }

        results.cleared++;
        results.details.push({
          orgId: org.id,
          schema: schemaName,
          deletedCount,
          status: "success",
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        logger.error("cron", `Failed to run log cleanup for organization ${org.id}`, err);
        results.failed++;
        results.details.push({
          orgId: org.id,
          schema: schemaName,
          deletedCount: 0,
          status: "error",
          error: errMsg,
        });
      }
    }

    logger.info("cron", `✓ GET /api/cron/cleanup-logs | 200 | ${Date.now() - _start}ms | Cleared: ${results.cleared}/${results.processed}`);
    return NextResponse.json({
      message: "Log cleanup cron job completed",
      ...results,
    });
  } catch (error) {
    logger.error("cron", "✗ GET /api/cron/cleanup-logs | Global error", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
