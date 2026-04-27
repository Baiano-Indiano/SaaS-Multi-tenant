"use server";

import { withAdminTenantDb } from "@/lib/db/tenant-db";
import { webhookDeliveries, workflows, connectors } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getDeliveryLogsAction(orgId: string) {
  try {
    const logs = await withAdminTenantDb(orgId, async (tx) => {
      return await tx
        .select({
          id: webhookDeliveries.id,
          eventType: webhookDeliveries.eventType,
          responseStatus: webhookDeliveries.responseStatus,
          duration: webhookDeliveries.duration,
          createdAt: webhookDeliveries.createdAt,
          workflowTrigger: workflows.trigger,
          connectorType: connectors.type,
          connectorName: connectors.name,
        })
        .from(webhookDeliveries)
        .leftJoin(workflows, eq(webhookDeliveries.workflowId, workflows.id))
        .leftJoin(connectors, eq(workflows.connectorId, connectors.id))
        .orderBy(desc(webhookDeliveries.createdAt))
        .limit(50);
    });

    return logs;
  } catch (error) {
    console.error("[Actions] Failed to fetch delivery logs:", error);
    return [];
  }
}
