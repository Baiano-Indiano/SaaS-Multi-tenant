import { Receiver } from "@upstash/qstash";
import { NextRequest, NextResponse } from "next/server";
import { withAdminTenantDb } from "@/lib/db/tenant-db";
import { webhookDeliveries } from "@/lib/db/schema";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

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

  const data = JSON.parse(body);
  const { orgId, workflowId, targetUrl, event, payload } = data;

  console.log(`[QStash Handler] Processing workflow ${workflowId} for org ${orgId}`);

  const start = Date.now();
  let responseStatus = 0;
  let responseBody = "";

  try {
    // 2. Execute Webhook Delivery
    // We should ideally sign this request too, but for MVP we just POST the JSON
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gravity-Event": event,
      },
      body: JSON.stringify(payload),
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
          payload: JSON.stringify(payload),
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
