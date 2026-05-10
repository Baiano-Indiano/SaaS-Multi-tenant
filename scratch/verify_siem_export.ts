import { recordAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { organizations, webhooks, webhookDeliveries } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { withAdminTenantDb } from "@/lib/db/tenant-db";

/**
 * verify_siem_export.ts
 * 
 * Verifies that recording an audit log triggers a real-time SIEM webhook event.
 */
async function main() {
  console.log("🚀 Starting SIEM Export Verification...");

  // 1. Find a test organization
  const orgs = await db.select().from(organizations).limit(1);
  if (orgs.length === 0) {
    console.error("❌ No organizations found. Create one first.");
    return;
  }
  const org = orgs[0];
  console.log(`Using Org: ${org.name} (${org.id})`);

  // 2. Setup a dummy SIEM Webhook for this org
  const webhookId = `wh_test_siem_${Date.now()}`;
  await withAdminTenantDb(org.id, async (tx) => {
    // Delete old test webhooks if any
    await tx.insert(webhooks).values({
      id: webhookId,
      url: "https://webhook.site/siem-test", // Dummy URL
      secret: "siem-secret-123",
      events: JSON.stringify(["audit.log_created"]),
      isActive: true,
    });
  });
  console.log(`✅ Dummy SIEM Webhook created: ${webhookId}`);

  // 3. Trigger an Audit Log
  console.log("📡 Recording test audit log...");
  await recordAuditLog({
    organizationId: org.id,
    action: "SIEM_TEST_ACTION",
    entityType: "SECURITY_TEST",
    actor: {
      id: "user_test_123",
      name: "SIEM Tester",
      email: "siem@test.com"
    },
    details: { foo: "bar", test: true },
    ip: "1.2.3.4",
    userAgent: "SIEM-Verifier/1.0"
  });

  // 4. Check if a Webhook Delivery was created
  console.log("🔎 Checking for webhook delivery record...");
  // Wait a bit for async emitEvent to finish
  await new Promise(resolve => setTimeout(resolve, 2000));

  await withAdminTenantDb(org.id, async (tx) => {
    const deliveries = await tx
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.eventType, "audit.log_created"))
      .orderBy(desc(webhookDeliveries.createdAt))
      .limit(1);

    if (deliveries.length > 0) {
      console.log("✅ Success! Webhook delivery found for 'audit.log_created'.");
      console.log("Delivery Data:", JSON.stringify(deliveries[0], null, 2));
    } else {
      console.error("❌ Failed: No webhook delivery record found. Check QSTASH_TOKEN or event logic.");
    }

    // Cleanup
    await tx.delete(webhooks).where(eq(webhooks.id, webhookId));
  });

  console.log("🏁 Verification Finished.");
}

main().catch(console.error);
