"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTenantDb } from "@/lib/db/tenant-db";
import { connectors } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/rbac-utils";
import { workflows } from "@/lib/db/schema";
import { SUPPORTED_EVENTS } from "@/lib/events";
import { validateExternalUrl } from "@/lib/security/url-validator";
import { createConnectorSchema, deleteConnectorSchema, testConnectorSchema, toggleConnectorEventSchema } from "@/lib/validations";

/**
 * createConnectorAction
 */
export async function createConnectorAction(data: {
  name: string;
  type: string;
  webhookUrl: string;
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    // Input Validation
    const validated = createConnectorSchema.parse(data);

    // RBAC: Verify user has permission to manage integrations
    await requirePermission(session.user.id, validated.orgId, "org:update");

    // SSRF-safe URL validation
    validateExternalUrl(data.webhookUrl);

    const config = JSON.stringify({ url: data.webhookUrl });

    const result = await getTenantDb(session.user.id, data.orgId, async (tx) => {
      const newConnector = await tx.insert(connectors).values({
        id: crypto.randomUUID(),
        name: data.name,
        type: data.type,
        config,
        isActive: true,
      }).returning();

      return newConnector[0];
    });

    // Auto-subscribe to default events for the "2-click" experience
    const defaultEvents = ["project.created", "member.invited", "organization.invitation_accepted"];
    const connectorConfig = JSON.parse(result.config);

    await getTenantDb(session.user.id, data.orgId, async (tx) => {
      for (const eventId of defaultEvents) {
        await tx.insert(workflows).values({
          id: crypto.randomUUID(),
          name: `Notify ${result.type} for ${eventId}`,
          trigger: eventId,
          actionType: "webhook",
          actionConfig: JSON.stringify({ url: connectorConfig.url }),
          connectorId: result.id,
          isActive: true
        });
      }
    });

    // Record Audit Log
    await recordAuditLog({
      organizationId: data.orgId,
      action: "CONNECTOR_CREATED",
      entityType: "CONNECTOR",
      entityId: result.id,
      details: `Created ${data.type} connector "${data.name}"`
    });

    revalidatePath(`/org/${data.orgSlug}/settings/integrations`);

    return { success: true, connector: result };
  } catch (error: unknown) {
    console.error("Failed to create connector:", error);
    const message = error instanceof Error ? error.message : "Failed to create connector";
    return { error: message };
  }
}

/**
 * deleteConnectorAction
 */
export async function deleteConnectorAction(data: {
  connectorId: string;
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    // Input Validation
    const validated = deleteConnectorSchema.parse(data);

    // RBAC: Verify user has permission to manage integrations
    await requirePermission(session.user.id, validated.orgId, "org:update");

    await getTenantDb(session.user.id, data.orgId, async (tx) => {
      await tx.delete(connectors).where(eq(connectors.id, data.connectorId));
    });

    // Record Audit Log
    await recordAuditLog({
      organizationId: data.orgId,
      action: "CONNECTOR_DELETED",
      entityType: "CONNECTOR",
      entityId: data.connectorId,
      details: `Deleted connector (ID: ${data.connectorId})`
    });

    revalidatePath(`/org/${data.orgSlug}/settings/integrations`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete connector:", error);
    return { error: "Failed to delete connector" };
  }
}

/**
 * getConnectorsAction
 */
export async function getConnectorsAction(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    return await getTenantDb(session.user.id, orgId, async (tx) => {
      return await tx.select().from(connectors).orderBy(desc(connectors.createdAt));
    });
  } catch (error: unknown) {
    console.error("Failed to fetch connectors:", error);
    return [];
  }
}

/**
 * testConnectorAction
 * 
 * Sends a dummy "Project Created" event to the connector to verify integration.
 */
export async function testConnectorAction(data: {
  connectorId: string;
  orgId: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    // Input Validation
    const validated = testConnectorSchema.parse(data);

    // RBAC: Verify user has permission to test integrations
    await requirePermission(session.user.id, validated.orgId, "org:update");

    const connector = await getTenantDb(session.user.id, data.orgId, async (tx) => {
      const results = await tx.select().from(connectors).where(eq(connectors.id, data.connectorId));
      return results[0];
    });

    if (!connector) throw new Error("Connector not found");

    const config = JSON.parse(connector.config);
    const { transformToSlack, transformToDiscord } = await import("@/lib/integrations/transformer");

    const testPayload = { name: "Quantum-Shield 🛡️", userName: session.user.name };
    let finalBody;

    if (connector.type === "slack") {
      finalBody = transformToSlack("project.created", testPayload);
    } else if (connector.type === "discord") {
      finalBody = transformToDiscord("project.created", testPayload);
    } else {
      finalBody = testPayload;
    }

    const response = await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalBody),
    });

    if (!response.ok) {
      throw new Error(`External service returned an error (HTTP ${response.status}).`);
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Test connector failed:", error);
    const message = error instanceof Error ? error.message : "Test failed";
    return { error: message };
  }
}

/**
 * getConnectorEventsAction
 */
export async function getConnectorEventsAction(data: {
  connectorId: string;
  orgId: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    const activeWorkflows = await getTenantDb(session.user.id, data.orgId, async (tx) => {
      return await tx.select()
        .from(workflows)
        .where(
          and(
            eq(workflows.connectorId, data.connectorId),
            eq(workflows.isActive, true)
          )
        );
    });

    const activeTriggers = new Set(activeWorkflows.map(w => w.trigger));

    return {
      success: true,
      events: SUPPORTED_EVENTS.map(event => ({
        ...event,
        isActive: activeTriggers.has(event.id)
      }))
    };
  } catch (error: unknown) {
    console.error("Failed to fetch connector events:", error);
    return { error: "Failed to fetch events" };
  }
}

/**
 * toggleConnectorEventAction
 */
export async function toggleConnectorEventAction(data: {
  connectorId: string;
  orgId: string;
  orgSlug: string;
  event: string;
  isActive: boolean;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    // Input Validation
    const validated = toggleConnectorEventSchema.parse(data);

    // RBAC: Verify user has permission to manage integrations
    await requirePermission(session.user.id, validated.orgId, "org:update");

    await getTenantDb(session.user.id, data.orgId, async (tx) => {
      if (data.isActive) {
        // Fetch connector details for the webhook URL
        const connector = await tx.select()
          .from(connectors)
          .where(eq(connectors.id, data.connectorId))
          .then(res => res[0]);

        if (!connector) throw new Error("Connector not found");

        const config = JSON.parse(connector.config);

        // Manual check for existing workflow to avoid duplicate triggers for same connector
        const existing = await tx.select()
          .from(workflows)
          .where(
            and(
              eq(workflows.connectorId, data.connectorId),
              eq(workflows.trigger, data.event)
            )
          ).then(res => res[0]);

        if (existing) {
          await tx.update(workflows)
            .set({ isActive: true })
            .where(eq(workflows.id, existing.id));
        } else {
          await tx.insert(workflows).values({
            id: crypto.randomUUID(),
            name: `Notify ${connector.type} for ${data.event}`,
            trigger: data.event,
            actionType: "webhook",
            actionConfig: JSON.stringify({ url: config.url }),
            connectorId: data.connectorId,
            isActive: true
          });
        }
      } else {
        // Disable workflow
        await tx.update(workflows)
          .set({ isActive: false })
          .where(
            and(
              eq(workflows.connectorId, data.connectorId),
              eq(workflows.trigger, data.event)
            )
          );
      }
    });

    revalidatePath(`/org/${data.orgSlug}/settings/integrations`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to toggle event:", error);
    return { error: "Failed to update notification setting" };
  }
}
