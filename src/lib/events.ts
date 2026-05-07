import { Client } from "@upstash/qstash";
import { withAdminTenantDb } from "./db/tenant-db";
import { workflows, webhooks, webhookDeliveries } from "./db/schema";
import { eq, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const SUPPORTED_EVENTS = [
  { 
    id: "project.created", 
    label: "Project Created", 
    description: "Notify when a new project is added",
    iconName: "rocket"
  },
  { 
    id: "project.deleted", 
    label: "Project Deleted", 
    description: "Notify when a project is removed",
    iconName: "trash"
  },
  { 
    id: "member.invited", 
    label: "Team Member Invited", 
    description: "Notify when an invitation is sent",
    iconName: "user-plus"
  },
  { 
    id: "organization.invitation_accepted", 
    label: "Member Joined", 
    description: "Notify when a new member joins",
    iconName: "shield-check"
  },
  { 
    id: "member.removed", 
    label: "Member Removed", 
    description: "Notify when a member is removed",
    iconName: "user-minus"
  },
  { 
    id: "role.updated", 
    label: "Permissions Changed", 
    description: "Notify when a member role is updated",
    iconName: "settings"
  },
] as const;

let qstashClient: Client | null = null;

function getQStashClient(): Client | null {
  const token = process.env.QSTASH_TOKEN;
  if (!token) return null;
  if (!qstashClient) {
    qstashClient = new Client({ token });
  }
  return qstashClient;
}

/**
 * emitEvent
 * 
 * Central hub for system events. Triggers matching workflows (internal integrations)
 * and standard webhooks (external consumers), publishing to QStash for background delivery.
 */
export async function emitEvent(orgId: string, event: string, payload: Record<string, unknown>) {
  console.log(`[Event Hub] Emitting event "${event}" for org "${orgId}"`);

  const qstash = getQStashClient();
  if (!qstash) {
    console.warn("[Event Hub] QSTASH_TOKEN is not set. Skipping workflow delivery.");
    return;
  }

  try {
    const { activeWorkflows, activeWebhooks } = await withAdminTenantDb(orgId, async (tx) => {
      const [w, h] = await Promise.all([
        tx.select().from(workflows).where(and(eq(workflows.trigger, event), eq(workflows.isActive, true))),
        tx.select().from(webhooks).where(and(eq(webhooks.isActive, true), sql`${webhooks.events}::jsonb ? ${event}`))
      ]);
      return { activeWorkflows: w, activeWebhooks: h };
    });

    const totalTargets = activeWorkflows.length + activeWebhooks.length;
    if (totalTargets === 0) {
      console.log(`[Event Hub] No active subscribers found for event "${event}"`);
      return;
    }

    console.log(`[Event Hub] Found ${totalTargets} matching targets. Publishing to QStash...`);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 1. Process Internal Workflows (Connectors like Slack/Discord)
    for (const workflow of activeWorkflows) {
      if (workflow.actionType === "webhook") {
        const config = JSON.parse(workflow.actionConfig);
        const deliveryId = `wd_wf_${uuidv4()}`;

        // Initial Log (Intent)
        await withAdminTenantDb(orgId, async (tx) => {
          await tx.insert(webhookDeliveries).values({
            id: deliveryId,
            workflowId: workflow.id,
            eventType: event,
            payload: JSON.stringify(payload),
            status: "processing",
          });
        });
        
        await qstash.publishJSON({
          url: `${appUrl}/api/webhooks/qstash-handler`,
          body: {
            orgId,
            deliveryId,
            workflowId: workflow.id,
            connectorId: workflow.connectorId,
            targetUrl: config.url,
            event,
            payload,
            secret: process.env.INTERNAL_WEBHOOK_SECRET || "internal-fallback",
          },
          headers: {
            "x-gravity-org-id": orgId,
            "x-gravity-workflow-id": workflow.id,
            "x-gravity-delivery-id": deliveryId,
          },
        });
      }
    }

    // 2. Process Standard External Webhooks
    for (const webhook of activeWebhooks) {
      const deliveryId = `wd_wh_${uuidv4()}`;

      // Initial Log (Intent)
      await withAdminTenantDb(orgId, async (tx) => {
        await tx.insert(webhookDeliveries).values({
          id: deliveryId,
          webhookId: webhook.id,
          eventType: event,
          payload: JSON.stringify(payload),
          status: "processing",
        });
      });

      await qstash.publishJSON({
        url: `${appUrl}/api/webhooks/qstash-handler`,
        body: {
          orgId,
          deliveryId,
          webhookId: webhook.id,
          targetUrl: webhook.url,
          event,
          payload,
          secret: webhook.secret,
        },
        headers: {
          "x-gravity-org-id": orgId,
          "x-gravity-webhook-id": webhook.id,
          "x-gravity-delivery-id": deliveryId,
        },
      });
    }

  } catch (error: unknown) {
    console.error(`[Event Hub] Error processing event "${event}":`, error);
  }
}
