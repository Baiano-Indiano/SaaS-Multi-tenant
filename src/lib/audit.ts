import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";
import { getTenantDb, withAdminTenantDb } from "./db/tenant-db";
import { auditLogs } from "./db/schema";
import { lt } from "drizzle-orm";
import type { TenantTransaction } from "./db/tenant-db";
import { emitEvent } from "./events";

const SENSITIVE_KEYWORDS = [
  "password", "token", "secret", "session",
  "backupcode", "webhook", "api_key", "apikey",
  "stripe", "payment", "card", "2fa", "mfa"
];

export function sanitizeAuditDetails(details: unknown): unknown {
  if (!details) return details;
  
  let obj = details;
  let isString = false;
  if (typeof details === "string") {
    try {
      obj = JSON.parse(details);
      isString = true;
    } catch {
      return details;
    }
  }

  if (typeof obj !== "object" || obj === null) {
    return details;
  }

  const sanitize = (item: unknown): unknown => {
    if (Array.isArray(item)) {
      return item.map(sanitize);
    }
    if (typeof item === "object" && item !== null) {
      const sanitized: Record<string, unknown> = Object.create(null);
      for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
          continue;
        }
        const lowerKey = key.toLowerCase();
        const isSensitive = SENSITIVE_KEYWORDS.some(keyword => lowerKey.includes(keyword));
        if (isSensitive) {
          Reflect.set(sanitized, key, "[REDACTED]");
        } else {
          Reflect.set(sanitized, key, sanitize(value));
        }
      }
      return sanitized;
    }
    return item;
  };

  const scrubbed = sanitize(obj as Record<string, unknown>);
  return isString ? JSON.stringify(scrubbed) : scrubbed;
}

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

  logger.info('audit', `➜ recordAuditLog | action: ${params.action} | entity: ${params.entityType} | org: ${params.organizationId}`);

  if (!params.actor) {
    try {
      session = await auth.api.getSession({
        headers: headersList || undefined,
      });
    } catch (e) {
      logger.error('audit', '✗ recordAuditLog | session fetch failed', e);
    }
  }

  if (!session && !params.actor) {
    logger.warn('audit', `⚠ recordAuditLog skipped | no session or actor found | org: ${params.organizationId}`);
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
        details: params.details ? (typeof params.details === "string" ? sanitizeAuditDetails(params.details) as string : JSON.stringify(sanitizeAuditDetails(params.details))) : null,
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

    logger.info('audit', `✓ recordAuditLog | action: ${params.action} | actor: ${userId} | org: ${params.organizationId}`);

    // Trigger SIEM/Webhook Export
    // Use fire-and-forget (or non-blocking) to avoid slowing down the main action
    const eventPayload = {
      timestamp: new Date().toISOString(),
      tenant_id: params.organizationId,
      actor_id: userId,
      actor_name: userName,
      actor_email: userEmail,
      action: params.action,
      resource_type: params.entityType,
      resource_id: params.entityId,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: params.details ? sanitizeAuditDetails(params.details) : {},
    };

    emitEvent(params.organizationId, "audit.log_created", eventPayload).catch(err => 
      logger.error('audit', `✗ SIEM event emission failed | action: ${params.action}`, err)
    );

  } catch (error) {
    logger.error('audit', `✗ recordAuditLog failed | action: ${params.action} | org: ${params.organizationId}`, error);
  }
}

/**
 * cleanupAuditLogs
 * 
 * Removes audit logs older than 90 days for a specific organization.
 * Should be run within a tenant-isolated transaction.
 */
export async function cleanupAuditLogs(tx: TenantTransaction) {
  logger.info('audit', '➜ cleanupAuditLogs | purging records older than 90 days');

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  await tx.delete(auditLogs).where(lt(auditLogs.createdAt, ninetyDaysAgo));

  logger.info('audit', '✓ cleanupAuditLogs completed');
}
