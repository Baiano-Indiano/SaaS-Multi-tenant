"use server";

import { withAdminTenantDb } from "@/lib/db/tenant-db";
import { webhookDeliveries, workflows, connectors, webhooks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export async function getDeliveryLogsAction(orgId: string) {
  try {
    const logs = await withAdminTenantDb(orgId, async (tx) => {
      return await tx
        .select({
          id: webhookDeliveries.id,
          eventType: webhookDeliveries.eventType,
          payload: webhookDeliveries.payload,
          responseStatus: webhookDeliveries.responseStatus,
          responseBody: webhookDeliveries.responseBody,
          duration: webhookDeliveries.duration,
          createdAt: webhookDeliveries.createdAt,
          workflowTrigger: workflows.trigger,
          connectorType: connectors.type,
          connectorName: connectors.name,
          webhookUrl: webhooks.url,
        })
        .from(webhookDeliveries)
        .leftJoin(workflows, eq(webhookDeliveries.workflowId, workflows.id))
        .leftJoin(connectors, eq(workflows.connectorId, connectors.id))
        .leftJoin(webhooks, eq(webhookDeliveries.webhookId, webhooks.id))
        .orderBy(desc(webhookDeliveries.createdAt))
        .limit(50);
    });

    return logs;
  } catch (error) {
    console.error("[Actions] Failed to fetch delivery logs:", error);
    return [];
  }
}

export async function retryWebhookDeliveryAction(orgId: string, oldDeliveryId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.session.activeOrganizationId !== orgId) {
      throw new Error("Unauthorized");
    }

    // 1. Fetch old delivery log
    const oldLog = await withAdminTenantDb(orgId, async (tx) => {
      const results = await tx
        .select({
          eventType: webhookDeliveries.eventType,
          payload: webhookDeliveries.payload,
          workflowId: webhookDeliveries.workflowId,
          webhookId: webhookDeliveries.webhookId,
        })
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.id, oldDeliveryId))
        .limit(1);
      return results[0];
    });

    if (!oldLog) {
      throw new Error("Log de entrega original não encontrado.");
    }

    // 2. Resolve target URL and signing secret
    let targetUrl = "";
    let secret = "";
    let connectorId: string | undefined;

    await withAdminTenantDb(orgId, async (tx) => {
      if (oldLog.workflowId) {
        const wf = await tx.select().from(workflows).where(eq(workflows.id, oldLog.workflowId)).limit(1);
        if (wf[0]) {
          const config = JSON.parse(wf[0].actionConfig);
          targetUrl = config.url;
          connectorId = wf[0].connectorId || undefined;
          
          // Use internal secret for connector workflows
          secret = process.env.INTERNAL_WEBHOOK_SECRET || "internal-secret";
        }
      } else if (oldLog.webhookId) {
        const wh = await tx.select().from(webhooks).where(eq(webhooks.id, oldLog.webhookId)).limit(1);
        if (wh[0]) {
          targetUrl = wh[0].url;
          secret = wh[0].secret;
        }
      }
    });

    if (!targetUrl) {
      throw new Error("Não foi possível resolver o destino do webhook para re-envio.");
    }

    const newDeliveryId = `wd_retry_${uuidv4()}`;

    // 3. Create a new log entry for the retry tracking
    await withAdminTenantDb(orgId, async (tx) => {
      await tx.insert(webhookDeliveries).values({
        id: newDeliveryId,
        webhookId: oldLog.webhookId,
        workflowId: oldLog.workflowId,
        eventType: oldLog.eventType,
        payload: oldLog.payload,
        status: "processing",
      });
    });

    // 4. Publish to QStash for async delivery
    const { Client } = await import("@upstash/qstash");
    const token = process.env.QSTASH_TOKEN;
    if (!token) {
      throw new Error("QStash token não configurado.");
    }

    const qstash = new Client({ token });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const payloadObj = JSON.parse(oldLog.payload);

    await qstash.publishJSON({
      url: `${appUrl}/api/webhooks/qstash-handler`,
      body: {
        orgId,
        deliveryId: newDeliveryId,
        workflowId: oldLog.workflowId || undefined,
        webhookId: oldLog.webhookId || undefined,
        connectorId,
        targetUrl,
        event: oldLog.eventType,
        payload: payloadObj,
        secret,
        depth: 1,
      },
      headers: {
        "x-gravity-org-id": orgId,
        "x-gravity-webhook-id": oldLog.webhookId || "",
        "x-gravity-workflow-id": oldLog.workflowId || "",
        "x-gravity-delivery-id": newDeliveryId,
        "x-gravity-depth": "1",
      },
    });

    return { success: true, newDeliveryId };
  } catch (error: unknown) {
    console.error("[Actions] Failed to retry webhook delivery:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    throw new Error(message);
  }
}
