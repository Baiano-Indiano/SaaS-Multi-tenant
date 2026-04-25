import { Client } from "@upstash/qstash";
import { withAdminTenantDb } from "./db/tenant-db";
import { workflows } from "./db/schema";
import { eq, and } from "drizzle-orm";

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
 * Central hub for system events. Triggers matching workflows and publishes 
 * to QStash for background delivery.
 */
export async function emitEvent(orgId: string, event: string, payload: Record<string, unknown>) {
  console.log(`[Event Hub] Emitting event "${event}" for org "${orgId}"`);

  const qstash = getQStashClient();
  if (!qstash) {
    console.warn("[Event Hub] QSTASH_TOKEN is not set. Skipping workflow delivery.");
    return;
  }

  try {
    const activeWorkflows = await withAdminTenantDb(orgId, async (tx) => {
      return await tx.select()
        .from(workflows)
        .where(
          and(
            eq(workflows.trigger, event),
            eq(workflows.isActive, true)
          )
        );
    });

    if (activeWorkflows.length === 0) {
      console.log(`[Event Hub] No active workflows found for event "${event}"`);
      return;
    }

    console.log(`[Event Hub] Found ${activeWorkflows.length} matching workflows. Publishing to QStash...`);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    for (const workflow of activeWorkflows) {
      // For now, we only support 'webhook' action
      if (workflow.actionType === "webhook") {
        const config = JSON.parse(workflow.actionConfig);
        
        await qstash.publishJSON({
          url: `${appUrl}/api/webhooks/qstash-handler`,
          body: {
            orgId,
            workflowId: workflow.id,
            connectorId: workflow.connectorId, // Added connectorId
            targetUrl: config.url,
            event,
            payload,
          },
          headers: {
            "x-gravity-org-id": orgId,
            "x-gravity-workflow-id": workflow.id,
          },
        });
      }
    }
  } catch (error: unknown) {
    console.error(`[Event Hub] Error processing event "${event}":`, error);
  }
}
