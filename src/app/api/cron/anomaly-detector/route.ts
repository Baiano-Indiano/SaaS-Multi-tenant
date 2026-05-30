import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { withAdminTenantDb } from "@/lib/db/tenant-db";
import { triggerAnomalyAlert } from "@/lib/security/anomaly-trigger";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const SAFE_SCHEMA_REGEX = /^tenant_[a-zA-Z0-9_]+$/;

/**
 * GET /api/cron/anomaly-detector
 * 
 * Vercel Cron/QStash task.
 * Runs every 15 minutes to inspect webhook deliveries patterns
 * and alert administrators in case of abnormal traffic spikes (>300%/hr).
 */
export async function GET(request: Request) {
  const _start = Date.now();
  logger.info("cron", "➜ GET /api/cron/anomaly-detector");
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn("cron", "Unauthorized anomaly-detector cron attempt");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 1. Fetch all active organizations
    const orgs = await db.select({
      id: organizations.id,
      tenantSchemaName: organizations.tenantSchemaName,
    })
    .from(organizations);

    const results = {
      processed: 0,
      triggered: 0,
      failed: 0,
      details: [] as {
        orgId: string;
        schema: string;
        lastHourCount: number;
        avg24hCount: number;
        status: "normal" | "alert" | "skipped" | "error";
        error?: string;
      }[],
    };

    // 2. Loop through each tenant and check webhook stats
    for (const org of orgs) {
      results.processed++;
      const schemaName = org.tenantSchemaName;

      if (!schemaName) {
        results.details.push({
          orgId: org.id,
          schema: "",
          lastHourCount: 0,
          avg24hCount: 0,
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
          lastHourCount: 0,
          avg24hCount: 0,
          status: "error",
          error: "Invalid tenant schema name format",
        });
        continue;
      }

      try {
        const stats = await withAdminTenantDb(org.id, async (tx) => {
          // Fetch counts using conditional filters inside single query
          const res = await tx.execute(
            sql`
              SELECT 
                COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '1 hour') as last_hour,
                COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '24 hours') as last_24h
              FROM webhook_delivery
            `
          );
          
          const row = res[0] as { last_hour: string | number; last_24h: string | number };
          const lastHour = Number(row?.last_hour || 0);
          const last24h = Number(row?.last_24h || 0);
          const avg24h = last24h / 24.0;
          
          return { lastHour, avg24h };
        });

        // Trigger condition:
        // - Volume in the last hour >= 50 (prevents false alarms on low traffic)
        // - Volume in the last hour > 300% of the 24-hour average (i.e. > 3 * avg24h)
        const isSurge = stats.lastHour >= 50 && stats.lastHour > 3 * stats.avg24h;

        if (isSurge) {
          results.triggered++;
          await triggerAnomalyAlert(
            org.id,
            "WEBHOOK_SURGE",
            `Tráfego de webhooks anômalo: ${stats.lastHour} disparos na última hora excedendo a média móvel das últimas 24h (${stats.avg24h.toFixed(1)}/h) em mais de 300%.`
          );
          
          results.details.push({
            orgId: org.id,
            schema: schemaName,
            lastHourCount: stats.lastHour,
            avg24hCount: stats.avg24h,
            status: "alert",
          });
        } else {
          results.details.push({
            orgId: org.id,
            schema: schemaName,
            lastHourCount: stats.lastHour,
            avg24hCount: stats.avg24h,
            status: "normal",
          });
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        logger.error("cron", `Failed webhook anomaly scan for Org ${org.id}`, err);
        results.failed++;
        results.details.push({
          orgId: org.id,
          schema: schemaName,
          lastHourCount: 0,
          avg24hCount: 0,
          status: "error",
          error: errMsg,
        });
      }
    }

    logger.info("cron", `✓ GET /api/cron/anomaly-detector | 200 | ${Date.now() - _start}ms | Processed: ${results.processed}, Alerts: ${results.triggered}`);
    return NextResponse.json({
      message: "Anomaly detection scan completed",
      ...results,
    });
  } catch (error) {
    logger.error("cron", "✗ GET /api/cron/anomaly-detector | Global error", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
