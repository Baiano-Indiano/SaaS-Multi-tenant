import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTenantDb } from "./db/tenant-db";
import { auditLogs } from "./db/schema";
import { nanoid } from "nanoid";
import { lt } from "drizzle-orm";
import type { TenantTransaction } from "./db/tenant-db";

/**
 * recordAuditLog
 * 
 * Captures an administrative action and stores it in the tenant's isolated schema.
 * Automatically extracts user session, IP address, and user agent.
 */
export async function recordAuditLog(params: {
  organizationId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown> | string | null;
  actor?: {
    id: string;
    name: string;
    email: string;
  };
}) {
  const session = params.actor ? null : await auth.api.getSession({
    headers: await headers(),
  });

  if (!session && !params.actor) {
    console.warn("Audit Log: No active session or manual actor found. Skipping log.");
    return;
  }

  const userId = params.actor?.id || session?.user.id;
  const userName = params.actor?.name || session?.user.name || "Unknown";
  const userEmail = params.actor?.email || session?.user.email || "unknown";

  if (!userId) return;

  const h = await headers();
  const ipAddress = h.get("x-forwarded-for") || h.get("x-real-ip") || "system";
  const userAgent = h.get("user-agent") || "system";

  try {
    await getTenantDb(userId, params.organizationId, async (tx) => {
      await tx.insert(auditLogs).values({
        id: `log_${nanoid()}`,
        userId: userId,
        userName: userName,
        userEmail: userEmail,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: typeof params.details === "string" ? params.details : (params.details ? JSON.stringify(params.details) : null),
        ipAddress,
        userAgent,
      });
    });
  } catch (error) {
    console.error("Failed to record audit log:", error);
    // We don't throw here to avoid breaking the main business flow if logging fails
  }
}

/**
 * cleanupAuditLogs
 * 
 * Removes audit logs older than 90 days for a specific organization.
 * Should be run within a tenant-isolated transaction.
 */
export async function cleanupAuditLogs(tx: TenantTransaction) {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  await tx.delete(auditLogs).where(lt(auditLogs.createdAt, ninetyDaysAgo));
}
