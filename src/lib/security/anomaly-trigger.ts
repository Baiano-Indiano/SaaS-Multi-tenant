import { redis } from "../redis";
import { db } from "../db";
import { members, users, organizations } from "../db/schema";
import { eq, and, or } from "drizzle-orm";
import { sendAnomalyAlertEmail } from "../mail";
import { recordAuditLog } from "../audit";

/**
 * Triggers a security anomaly alert email to admins,
 * enforcing a 30-minute cooldown and recording the event in the audit trail.
 */
export async function triggerAnomalyAlert(
  organizationId: string,
  type: "MFA_SPIKE" | "WEBHOOK_SURGE",
  details: string
): Promise<void> {
  const cooldownKey = `org:${organizationId}:anomaly_cooldown:${type}`;
  
  try {
    // 1. Check cooldown in Redis
    const isOnCooldown = await redis.get(cooldownKey);
    if (isOnCooldown) {
      console.log(`[Security Anomaly] Alert for Org ${organizationId} of type ${type} is on cooldown. Suppressing email.`);
      return;
    }

    // 2. Fetch organization details
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
      columns: {
        name: true,
      },
    });
    const orgName = org?.name || "Organização Desconhecida";

    // 3. Fetch all admins and owners
    const adminMembers = await db
      .select({
        name: users.name,
        email: users.email,
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(
        and(
          eq(members.organizationId, organizationId),
          or(eq(members.role, "admin"), eq(members.role, "owner"))
        )
      );

    // 4. Resolve alert recipients
    let recipients: { name: string; email: string }[] = [];
    if (adminMembers.length === 0) {
      console.log(`[Security Anomaly] No active admins/owners found for Org ${organizationId}. Falling back to internal support email.`);
      recipients = [{
        name: "Security Team",
        email: "security@saas-starter.internal",
      }];
    } else {
      recipients = adminMembers;
    }

    // 5. Set 30 minutes cooldown (1800 seconds) in Redis
    await redis.set(cooldownKey, "1", { ex: 1800 });

    // 6. Send emails
    for (const recipient of recipients) {
      await sendAnomalyAlertEmail({
        to: recipient.email,
        orgName,
        type,
        details,
      });
    }

    // 7. Record system audit log entry
    await recordAuditLog({
      organizationId,
      action: "SECURITY_ANOMALY_DETECTED",
      entityType: "ORGANIZATION",
      entityId: organizationId,
      details: {
        anomalyType: type,
        details,
        recipientsCount: recipients.length,
        message: `Anomalia detectada: ${type}. Mensagem: ${details}`,
      },
      actor: {
        id: "system",
        name: "System Cron",
        email: "system@saas-starter.internal",
      },
    });

  } catch (error) {
    console.error(`[Security Anomaly] Failed to process anomaly trigger for Org ${organizationId}:`, error);
  }
}
