"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTenantDb } from "@/lib/db/tenant-db";
import { workflows } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordAuditLog } from "@/lib/audit";

/**
 * createWorkflowAction
 */
export async function createWorkflowAction(data: {
  name: string;
  trigger: string;
  targetUrl: string;
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    // Basic URL validation
    const url = new URL(data.targetUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error("Invalid URL protocol. Use HTTP or HTTPS.");
    }

    const actionConfig = JSON.stringify({ url: data.targetUrl });

    const result = await getTenantDb(session.user.id, data.orgId, async (tx) => {
      const newWorkflow = await tx.insert(workflows).values({
        id: crypto.randomUUID(),
        name: data.name,
        trigger: data.trigger,
        actionType: "webhook",
        actionConfig,
        isActive: true,
      }).returning();

      return newWorkflow[0];
    });

    // Record Audit Log
    await recordAuditLog({
      organizationId: data.orgId,
      action: "WORKFLOW_CREATED",
      entityType: "WORKFLOW",
      entityId: result.id,
      details: `Created workflow "${data.name}" for trigger "${data.trigger}"`
    });

    revalidatePath(`/org/${data.orgSlug}/settings/connectivity`);

    return { success: true, workflow: result };
  } catch (error: unknown) {
    console.error("Failed to create workflow:", error);
    const message = error instanceof Error ? error.message : "Failed to create workflow";
    return { error: message };
  }
}

/**
 * deleteWorkflowAction
 */
export async function deleteWorkflowAction(data: {
  workflowId: string;
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    await getTenantDb(session.user.id, data.orgId, async (tx) => {
      await tx.delete(workflows).where(eq(workflows.id, data.workflowId));
    });

    // Record Audit Log
    await recordAuditLog({
      organizationId: data.orgId,
      action: "WORKFLOW_DELETED",
      entityType: "WORKFLOW",
      entityId: data.workflowId,
      details: `Deleted workflow (ID: ${data.workflowId})`
    });

    revalidatePath(`/org/${data.orgSlug}/settings/connectivity`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete workflow:", error);
    return { error: "Failed to delete workflow" };
  }
}

/**
 * getWorkflowsAction
 */
export async function getWorkflowsAction(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    return await getTenantDb(session.user.id, orgId, async (tx) => {
      return await tx.select().from(workflows).orderBy(desc(workflows.createdAt));
    });
  } catch (error: unknown) {
    console.error("Failed to fetch workflows:", error);
    return [];
  }
}

/**
 * getWorkflowLogsAction
 */
export async function getWorkflowLogsAction(orgId: string, workflowId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    const { webhookDeliveries } = await import("@/lib/db/schema");
    
    return await getTenantDb(session.user.id, orgId, async (tx) => {
      return await tx.select()
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.workflowId, workflowId))
        .orderBy(desc(webhookDeliveries.createdAt))
        .limit(50);
    });
  } catch (error: unknown) {
    console.error("Failed to fetch workflow logs:", error);
    return [];
  }
}
