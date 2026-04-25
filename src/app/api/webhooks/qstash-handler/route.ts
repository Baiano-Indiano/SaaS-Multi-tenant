import { Receiver } from "@upstash/qstash";
import { NextRequest, NextResponse } from "next/server";
import { withAdminTenantDb } from "@/lib/db/tenant-db";
import { webhookDeliveries, connectors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { transformToSlack, transformToDiscord } from "@/lib/integrations/transformer";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

interface QStashPayload {
  orgId: string;
  workflowId: string;
  connectorId?: string;
  targetUrl: string;
  event: string;
  payload: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("upstash-signature");
  if (!signature) {
    return new NextResponse("Missing signature", { status: 401 });
  }

  const body = await req.text();
  
  // 1. Verify QStash Signature
  const isValid = await receiver.verify({
    signature,
    body,
  }).catch(() => false);

  if (!isValid) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const data = JSON.parse(body) as QStashPayload;
  const { orgId, workflowId, connectorId, targetUrl, event, payload } = data;

  console.log(`[QStash Handler] Processing workflow ${workflowId} for org ${orgId}`);

  let finalUrl = targetUrl;
  let finalPayload = payload;

  const start = Date.now();
  let responseStatus = 0;
  let responseBody = "";

  try {
    // 1.5 Resolve Connector if present
    if (connectorId) {
      await withAdminTenantDb(orgId, async (tx) => {
        const results = await tx.select().from(connectors).where(eq(connectors.id, connectorId));
        const connector = results[0];
        if (connector) {
          const config = JSON.parse(connector.config);
          finalUrl = config.url;

          if (connector.type === "slack") {
            finalPayload = transformToSlack(event, payload);
          } else if (connector.type === "discord") {
            finalPayload = transformToDiscord(event, payload);
          }
        }
      });
    }

    // 2. Execute Webhook Delivery
    const response = await fetch(finalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gravity-Event": event,
      },
      body: JSON.stringify(finalPayload),
    });

    responseStatus = response.status;
    responseBody = await response.text();
  } catch (error: unknown) {
    console.error(`[QStash Handler] Webhook delivery failed for ${targetUrl}:`, error);
    responseStatus = 500;
    responseBody = error instanceof Error ? error.message : "Unknown error";
  } finally {
    const duration = `${Date.now() - start}ms`;

    // 3. Record Delivery Log in Tenant Schema
    try {
      await withAdminTenantDb(orgId, async (tx) => {
        await tx.insert(webhookDeliveries).values({
          id: crypto.randomUUID(),
          workflowId: workflowId, // Use the dedicated column
          eventType: event,
          payload: JSON.stringify(finalPayload),
          responseStatus: responseStatus.toString(),
          responseBody: responseBody.slice(0, 1000), // Truncate if too large
          duration,
        });
      });
    } catch (dbError: unknown) {
      console.error("[QStash Handler] Failed to log delivery:", dbError);
    }
  }

  return NextResponse.json({ success: true });
}
