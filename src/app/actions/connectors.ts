"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTenantDb } from "@/lib/db/tenant-db";
import { connectors } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordAuditLog } from "@/lib/audit";

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
    // Basic URL validation
    const url = new URL(data.webhookUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error("Invalid URL protocol. Use HTTP or HTTPS.");
    }

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
      const errorText = await response.text();
      throw new Error(`External service failed (${response.status}): ${errorText}`);
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Test connector failed:", error);
    const message = error instanceof Error ? error.message : "Test failed";
    return { error: message };
  }
}
