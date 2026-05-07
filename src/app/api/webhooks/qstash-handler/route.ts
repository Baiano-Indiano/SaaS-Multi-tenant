import { Receiver } from "@upstash/qstash";
import { NextRequest, NextResponse } from "next/server";
import { withAdminTenantDb } from "@/lib/db/tenant-db";
import { webhookDeliveries, connectors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { transformToSlack, transformToDiscord } from "@/lib/integrations/transformer";
import { generateWebhookSignature } from "@/lib/webhooks";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

interface QStashPayload {
  orgId: string;
  deliveryId: string;
  workflowId?: string;
  webhookId?: string;
  connectorId?: string;
  targetUrl: string;
  event: string;
  payload: Record<string, unknown>;
  secret: string; // Used for HMAC signing
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("upstash-signature");
  if (!signature) {
    return new NextResponse("Missing signature", { status: 401 });
  }

  const body = await req.text();
  
  // 1. Verify QStash Signature (Incoming from our own backend)
  const isValid = await receiver.verify({
    signature,
    body,
  }).catch(() => false);

  if (!isValid) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const data = JSON.parse(body) as QStashPayload;
  const { orgId, deliveryId, connectorId, targetUrl, event, payload, secret } = data;

  console.log(`[QStash Handler] Processing delivery ${deliveryId} for org ${orgId}, event ${event}`);

  let finalUrl = targetUrl;
  let finalPayload = payload;

  const start = Date.now();
  let responseStatus = 0;
  let responseBody = "";

  try {
    // 1.5 Resolve Connector if present (for Slack/Discord formatting)
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

    // 2. Generate HMAC Signature (x-hub-signature-256)
    const payloadString = JSON.stringify(finalPayload);
    const hmacSignature = generateWebhookSignature(payloadString, secret);

    // 3. Execute Webhook Delivery
    const response = await fetch(finalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gravity-Event": event,
        "X-Hub-Signature-256": hmacSignature,
      },
      body: payloadString,
    });

    responseStatus = response.status;
    responseBody = await response.text();
  } catch (error: unknown) {
    console.error(`[QStash Handler] Webhook delivery failed for ${targetUrl}:`, error);
    responseStatus = 500;
    responseBody = error instanceof Error ? error.message : "Unknown error";
  } finally {
    const duration = `${Date.now() - start}ms`;

    // 4. Update Final Delivery Status in Tenant Schema
    try {
      await withAdminTenantDb(orgId, async (tx) => {
        const isSuccess = responseStatus >= 200 && responseStatus < 300;
        
        await tx.update(webhookDeliveries)
          .set({
            status: isSuccess ? "delivered" : "failed",
            responseStatus: responseStatus.toString(),
            responseBody: responseBody.slice(0, 1000), // Truncate if too large
            duration,
          })
          .where(eq(webhookDeliveries.id, deliveryId));
      });
    } catch (dbError: unknown) {
      console.error(`[QStash Handler] Failed to finalize delivery ${deliveryId}:`, dbError);
    }
  }

  return NextResponse.json({ success: true });
}
