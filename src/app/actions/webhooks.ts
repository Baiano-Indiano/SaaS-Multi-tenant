"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTenantDb } from "@/lib/db/tenant-db";
import { webhooks, webhookDeliveries } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordAuditLog } from "@/lib/audit";

/**
 * createWebhookAction
 */
export async function createWebhookAction(data: {
  url: string;
  events: string[];
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    // Basic URL validation
    const url = new URL(data.url);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error("Invalid URL protocol. Use HTTP or HTTPS.");
    }

    // Generate a signing secret (whsec_...)
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    const secret = `whsec_${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;

    const result = await getTenantDb(session.user.id, data.orgId, async (tx) => {
      const newWebhook = await tx.insert(webhooks).values({
        id: crypto.randomUUID(),
        url: data.url,
        secret,
        events: JSON.stringify(data.events),
        isActive: true,
      }).returning();

      return newWebhook[0];
    });

    // Record Audit Log
    await recordAuditLog({
      organizationId: data.orgId,
      action: "WEBHOOK_CREATED",
      entityType: "WEBHOOK",
      entityId: result.id,
      details: `Registered webhook for URL: ${data.url}`
    });

    revalidatePath(`/org/${data.orgSlug}/settings/connectivity`);

    return { success: true, webhook: result };
  } catch (error: unknown) {
    console.error("Failed to create webhook:", error);
    const message = error instanceof Error ? error.message : "Failed to create webhook";
    return { error: message };
  }
}

/**
 * deleteWebhookAction
 */
export async function deleteWebhookAction(data: {
  webhookId: string;
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    await getTenantDb(session.user.id, data.orgId, async (tx) => {
      await tx.delete(webhooks).where(eq(webhooks.id, data.webhookId));
    });

    // Record Audit Log
    await recordAuditLog({
      organizationId: data.orgId,
      action: "WEBHOOK_DELETED",
      entityType: "WEBHOOK",
      entityId: data.webhookId,
      details: `Deleted webhook (ID: ${data.webhookId})`
    });

    revalidatePath(`/org/${data.orgSlug}/settings/connectivity`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete webhook:", error);
    return { error: "Failed to delete webhook" };
  }
}

/**
 * getWebhooksAction
 */
export async function getWebhooksAction(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    return await getTenantDb(session.user.id, orgId, async (tx) => {
      return await tx.select().from(webhooks).orderBy(desc(webhooks.createdAt));
    });
  } catch (error: unknown) {
    console.error("Failed to fetch webhooks:", error);
    return [];
  }
}

/**
 * getWebhookDeliveriesAction
 */
export async function getWebhookDeliveriesAction(orgId: string, webhookId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    return await getTenantDb(session.user.id, orgId, async (tx) => {
      return await tx.select()
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.webhookId, webhookId))
        .orderBy(desc(webhookDeliveries.createdAt))
        .limit(50);
    });
  } catch (error: unknown) {
    console.error("Failed to fetch webhook deliveries:", error);
    return [];
  }
}
