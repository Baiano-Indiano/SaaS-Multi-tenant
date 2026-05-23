"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTenantDb } from "@/lib/db/tenant-db";
import { workflows } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/rbac-utils";
import { validateExternalUrl } from "@/lib/security/url-validator";
import { createWorkflowSchema, deleteWorkflowSchema, retryWorkflowDeliverySchema } from "@/lib/validations";

/**
 * createWorkflowAction
 */
export async function createWorkflowAction(data: {
  name: string;
  trigger: string;
  targetUrl?: string;
  connectorId?: string;
  filters?: any;
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    // Input Validation
    const validated = createWorkflowSchema.parse(data);

    // RBAC: Verify user has permission to manage workflows
    await requirePermission(session.user.id, validated.orgId, "org:update");

    let actionConfig = "{}";
    if (data.targetUrl) {
      // SSRF-safe URL validation
      validateExternalUrl(data.targetUrl);
      actionConfig = JSON.stringify({ url: data.targetUrl });
    }

    const result = await getTenantDb(session.user.id, data.orgId, async (tx) => {
      const newWorkflow = await tx.insert(workflows).values({
        id: crypto.randomUUID(),
        name: data.name,
        trigger: data.trigger,
        actionType: "webhook",
        actionConfig,
        connectorId: data.connectorId,
        filters: data.filters ? JSON.stringify(data.filters) : null,
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
    // Input Validation
    const validated = deleteWorkflowSchema.parse(data);

    // RBAC: Verify user has permission to manage workflows
    await requirePermission(session.user.id, validated.orgId, "org:update");

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

/**
 * retryWorkflowDeliveryAction
 */
export async function retryWorkflowDeliveryAction(data: {
  deliveryId: string;
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    // Input Validation
    const validated = retryWorkflowDeliverySchema.parse(data);

    // RBAC: Verify user has permission to retry workflow deliveries
    await requirePermission(session.user.id, validated.orgId, "org:update");

    const { webhookDeliveries, workflows } = await import("@/lib/db/schema");
    const { Client } = await import("@upstash/qstash");

    const token = process.env.QSTASH_TOKEN;
    if (!token) throw new Error("QStash token not configured");
    const qstash = new Client({ token });

    const result = await getTenantDb(session.user.id, data.orgId, async (tx) => {
      const delivery = await tx.select().from(webhookDeliveries).where(eq(webhookDeliveries.id, data.deliveryId)).limit(1);
      if (!delivery[0]) throw new Error("Delivery not found");

      if (!delivery[0].workflowId) throw new Error("No workflow associated with this delivery");
      const workflow = await tx.select().from(workflows).where(eq(workflows.id, delivery[0].workflowId)).limit(1);
      if (!workflow[0]) throw new Error("Workflow not found");

      return { delivery: delivery[0], workflow: workflow[0] };
    });

    const { delivery, workflow } = result;
    const config = JSON.parse(workflow.actionConfig);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Re-publish to QStash handler
    // We OMIT connectorId here because the payload is ALREADY transformed in the delivery log
    await qstash.publishJSON({
      url: `${appUrl}/api/webhooks/qstash-handler`,
      body: {
        orgId: data.orgId,
        workflowId: workflow.id,
        targetUrl: config.url,
        event: delivery.eventType,
        payload: JSON.parse(delivery.payload),
      },
      headers: {
        "x-gravity-org-id": data.orgId,
        "x-gravity-workflow-id": workflow.id,
        "x-gravity-retry": "true",
      },
    });

    await recordAuditLog({
      organizationId: data.orgId,
      action: "WORKFLOW_RETRY",
      entityType: "WORKFLOW",
      entityId: workflow.id,
      details: `Retried delivery ${data.deliveryId} for workflow "${workflow.name}"`
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to retry workflow delivery:", error);
    return { error: error instanceof Error ? error.message : "Failed to retry workflow delivery" };
  }
}
