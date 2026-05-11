"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTenantDb as getDb } from "@/lib/db/tenant-db";
import { auditLogs } from "@/lib/db/schema";
import { desc, and, ilike, or, eq } from "drizzle-orm";
import { cleanupAuditLogs } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/rbac-utils";

export async function getAuditLogsAction(
  organizationId: string, 
  options?: { 
    query?: string; 
    entityType?: string; 
    limit?: number 
  }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const { user } = session;

  // RBAC: Verify user has permission to read audit logs
  await requirePermission(user.id, organizationId, "audit_logs:read");

  return await getDb(user.id, organizationId, async (tx) => {
    let conditions = undefined;

    if (options?.entityType && options.entityType !== "all") {
      const type = options.entityType.toUpperCase();
      let typeFilter;
      
      if (type === "SETTINGS") {
        typeFilter = or(
          eq(auditLogs.entityType, "DOMAIN"),
          eq(auditLogs.entityType, "ORGANIZATION"),
          eq(auditLogs.entityType, "SETTINGS")
        );
      } else if (type === "ROLE") {
        typeFilter = or(
          eq(auditLogs.entityType, "ROLE"),
          eq(auditLogs.entityType, "PERMISSION")
        );
      } else {
        typeFilter = eq(auditLogs.entityType, type);
      }
      
      conditions = conditions ? and(conditions, typeFilter) : typeFilter;
    }

    if (options?.query) {
      const searchFilter = or(
        ilike(auditLogs.action, `%${options.query}%`),
        ilike(auditLogs.userName, `%${options.query}%`),
        ilike(auditLogs.details, `%${options.query}%`),
        ilike(auditLogs.entityType, `%${options.query}%`)
      );
      conditions = conditions ? and(conditions, searchFilter) : searchFilter;
    }

    const logs = await tx.select()
      .from(auditLogs)
      .where(conditions)
      .orderBy(desc(auditLogs.createdAt))
      .limit(options?.limit || 100);

    return logs;
  }, { mode: 'reader' });
}

export async function triggerCleanupAction(organizationId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");
  
  const { user } = session;

  // RBAC: Verify user has permission to manage org/audit logs
  await requirePermission(user.id, organizationId, "org:update");

  return await getDb(user.id, organizationId, async (tx) => {
    await cleanupAuditLogs(tx);
    return { success: true };
  });
}
