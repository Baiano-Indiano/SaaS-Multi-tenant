import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
import { billingUsage, organizations } from "@/lib/db/schema";
import { getUsage, incrementUsage } from "@/lib/billing/telemetry";
import { eq, sql } from "drizzle-orm";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-expect-error - Stripe type definitions mismatches in this specific version
  apiVersion: "2025-02-24.acacia",
});

// Map of metric name to Stripe Price ID
const METRIC_PRICE_IDS: Record<string, string> = {
  api_calls: process.env.STRIPE_METERED_API_CALLS_PRICE_ID || "price_1TOSUBKgmt5iTW4YMetered",
  workflow_triggers: process.env.STRIPE_METERED_WORKFLOW_TRIGGERS_PRICE_ID || "price_1TOSUBKgmt5iTW4YMeteredWorkflows",
  webhook_deliveries: process.env.STRIPE_METERED_WEBHOOK_DELIVERIES_PRICE_ID || "price_1TOSUBKgmt5iTW4YMeteredWebhooks",
};

/**
 * GET /api/cron/billing-sync
 * 
 * Vercel Cron/QStash task.
 * Syncs Redis usage buffers to PostgreSQL and reports to Stripe in batches.
 */
export async function GET(request: Request) {
  const _start = Date.now();
  logger.info("cron", "➜ GET /api/cron/billing-sync");
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn("cron", "Unauthorized billing sync attempt");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 1. Scan/find all telemetry keys in Redis
    const keys = await redis.keys("billing:usage:*:*");
    logger.info("cron", `Found ${keys.length} usage key(s) to process`);

    const results = {
      processed: 0,
      synced: 0,
      failed: 0,
      errors: [] as { key: string; error: string }[],
    };

    // 2. Process keys in parallel batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (key) => {
          results.processed++;
          const parts = key.split(":");
          if (parts.length !== 4) {
            logger.warn("cron", `Invalid telemetry key format: ${key}`);
            return;
          }

          const orgId = parts[2];
          const metric = parts[3];

          try {
            // Get current usage from Redis
            const pendingAmount = await getUsage(orgId, metric);
            if (pendingAmount <= 0) {
              return;
            }

            // Sync to PostgreSQL (Public schema 'billing_usage' table)
            const usageId = `${orgId}:${metric}`;
            await db.insert(billingUsage)
              .values({
                id: usageId,
                organizationId: orgId,
                metric,
                quantity: pendingAmount,
                updatedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: [billingUsage.organizationId, billingUsage.metric],
                set: {
                  quantity: sql`${billingUsage.quantity} + ${pendingAmount}`,
                  updatedAt: new Date(),
                },
              });

            // Report to Stripe if the organization has an active Stripe subscription
            const org = await db.query.organizations.findFirst({
              where: eq(organizations.id, orgId),
              columns: {
                stripeSubscriptionId: true,
              },
            });

            if (org?.stripeSubscriptionId) {
              const priceId = METRIC_PRICE_IDS[metric];
              if (priceId) {
                // Fetch the subscription details to find the correct subscription item
                const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
                const item = subscription.items.data.find((item) => item.price.id === priceId);

                if (item) {
                  // Report the usage record to Stripe
                  await (stripe.subscriptionItems as any).createUsageRecord(
                    item.id,
                    {
                      quantity: pendingAmount,
                      timestamp: Math.floor(Date.now() / 1000),
                      action: "increment",
                    }
                  );
                  logger.info("cron", `Reported ${pendingAmount} ${metric} to Stripe for org ${orgId}`);
                } else {
                  logger.warn("cron", `No subscription item found on Stripe for Price ${priceId} (Org ${orgId})`);
                }
              } else {
                logger.warn("cron", `No Stripe Price ID configured for metric: ${metric}`);
              }
            }

            // Decrement Redis atomically by the amount synced
            await incrementUsage(orgId, metric, -pendingAmount);
            results.synced++;
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Unknown error";
            logger.error("cron", `Failed to sync usage for key ${key}`, err);
            results.failed++;
            results.errors.push({ key, error: errMsg });
          }
        })
      );
    }

    logger.info("cron", `✓ GET /api/cron/billing-sync | 200 | ${Date.now() - _start}ms | Synced: ${results.synced}/${results.processed}`);
    return NextResponse.json({
      message: "Billing sync completed",
      ...results,
    });
  } catch (error) {
    logger.error("cron", "✗ GET /api/cron/billing-sync | Global error", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
