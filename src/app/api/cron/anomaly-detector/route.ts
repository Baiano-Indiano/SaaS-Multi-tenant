import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { checkWebhookSurge } from "@/lib/security/webhook-tracker";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/anomaly-detector
 * 
 * Vercel Cron/QStash task.
 * Runs periodically to evaluate webhook delivery patterns via Redis ZSET logs.
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
    const orgs = await db.select({
      id: organizations.id,
      name: organizations.name,
    }).from(organizations);

    const results = {
      processed: 0,
      triggered: 0,
      failed: 0,
      details: [] as { orgId: string; status: "checked" | "error"; error?: string }[],
    };

    for (const org of orgs) {
      results.processed++;
      try {
        const triggered = await checkWebhookSurge(org.id);
        if (triggered) {
          results.triggered++;
        }
        results.details.push({
          orgId: org.id,
          status: "checked",
        });
      } catch (err: any) {
        results.failed++;
        results.details.push({
          orgId: org.id,
          status: "error",
          error: err?.message || "Unknown error",
        });
      }
    }

    logger.info("cron", `✓ GET /api/cron/anomaly-detector | 200 | ${Date.now() - _start}ms | Processed: ${results.processed}, Alerts Triggered: ${results.triggered}`);
    return NextResponse.json({
      message: "Webhook surge anomaly scan completed",
      ...results,
    });
  } catch (error) {
    logger.error("cron", "✗ GET /api/cron/anomaly-detector | Global error", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
