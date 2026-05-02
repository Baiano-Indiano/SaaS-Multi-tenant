import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTenantDb, withAdminTenantDb } from "./db/tenant-db";
import { auditLogs } from "./db/schema";
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
  ip?: string;
  userAgent?: string;
}) {
  let session = null;
  let headersList = null;

  try {
    headersList = await headers();
  } catch {
    // headers() might fail in some contexts (e.g. outside of request)
  }

  if (!params.actor) {
    try {
      session = await auth.api.getSession({
        headers: headersList || undefined,
      });
    } catch (e) {
      console.error("Audit Log: Failed to get session:", e);
    }
  }

  if (!session && !params.actor) {
    console.warn("Audit Log: No active session or manual actor found. Skipping log.");
    return;
  }

  const userId = params.actor?.id || session?.user.id;
  const userName = params.actor?.name || session?.user.name || "Unknown";
  const userEmail = params.actor?.email || session?.user.email || "unknown";

  if (!userId) return;

  const ipAddress = params.ip || headersList?.get("x-forwarded-for") || headersList?.get("x-real-ip") || "system";
  const userAgent = params.userAgent || headersList?.get("user-agent") || "system";

  try {
    const insertLog = async (tx: TenantTransaction) => {
      await tx.insert(auditLogs).values({
        id: `log_${crypto.randomUUID()}`,
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
    };

    // When actor is explicitly provided, bypass membership check
    // to avoid race conditions (e.g., logging after member removal)
    if (params.actor) {
      await withAdminTenantDb(params.organizationId, insertLog);
    } else {
      await getTenantDb(userId!, params.organizationId, insertLog);
    }
  } catch (error) {
    console.error("Failed to record audit log:", error);
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
