import { auditLogs, auditExportConfigs } from "@/lib/db/schema";
import { withAdminTenantDb } from "@/lib/db/tenant-db";
import { eq, and, gte, lte } from "drizzle-orm";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { decrypt } from "./crypto";

export interface AuditExportPayload {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * formatForSIEM
 * 
 * Formats an audit log into a flat JSON structure optimized for SIEM ingestion.
 */
export function formatForSIEM(log: AuditExportPayload, orgId: string) {
  return {
    timestamp: log.createdAt.toISOString(),
    event_id: log.id,
    tenant_id: orgId,
    actor_id: log.userId,
    actor_name: log.userName,
    actor_email: log.userEmail,
    action: log.action,
    resource_type: log.entityType,
    resource_id: log.entityId,
    ip_address: log.ipAddress,
    user_agent: log.userAgent,
    details: log.details ? (typeof log.details === 'string' ? JSON.parse(log.details) : log.details) : {},
  };
}

/**
 * getLogsForExport
 * 
 * Fetches audit logs for a specific time range from a tenant schema.
 * Uses the Read Replica for this heavy query.
 */
export async function getLogsForExport(orgId: string, from: Date, to: Date) {
  return await withAdminTenantDb(orgId, async (tx) => {
    return await tx
      .select()
      .from(auditLogs)
      .where(
        and(
          gte(auditLogs.createdAt, from),
          lte(auditLogs.createdAt, to)
        )
      )
      .orderBy(auditLogs.createdAt);
  }, { mode: 'reader' });
}

/**
 * runDailyAuditExport
 * 
 * Logic for the daily cron job. Finds organizations with active S3/GCS exports,
 * aggregates their logs for the last 24h, and uploads them.
 * 
 * Hardened with:
 * - Retry with exponential backoff (3 attempts)
 * - Error state persistence for admin observability
 */
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function uploadWithRetry(
  s3Client: S3Client,
  params: { Bucket: string; Key: string; Body: string; ContentType: string },
  retries = MAX_RETRIES
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await s3Client.send(new PutObjectCommand(params));
      return;
    } catch (error) {
      if (attempt === retries) throw error;
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(`[Audit Exporter] Upload attempt ${attempt}/${retries} failed. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export async function runDailyAuditExport(orgId: string) {
  console.log(`[Audit Exporter] Starting daily export for organization ${orgId}`);

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const config = await withAdminTenantDb(orgId, async (tx) => {
    const results = await tx
      .select()
      .from(auditExportConfigs)
      .where(eq(auditExportConfigs.isActive, true))
      .limit(1);
    return results[0];
  });

  if (!config) {
    console.log(`[Audit Exporter] No active export configuration for ${orgId}. Skipping.`);
    return;
  }

  const logs = await getLogsForExport(orgId, yesterday, now);
  
  if (logs.length === 0) {
    console.log(`[Audit Exporter] No logs to export for the last 24h.`);
    return;
  }

  const exportData = JSON.stringify(logs.map(log => formatForSIEM(log as AuditExportPayload, orgId)), null, 2);
  const fileName = `audit-logs-${yesterday.toISOString().split('T')[0]}.json`;

  try {
    const s3Client = new S3Client({
      region: config.region || 'us-east-1',
      endpoint: config.endpoint || undefined,
      forcePathStyle: !!config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId ? decrypt(config.accessKeyId) : '',
        secretAccessKey: config.secretAccessKey ? decrypt(config.secretAccessKey) : '',
      },
    });

    console.log(`[Audit Exporter] Uploading ${logs.length} logs to S3 bucket "${config.bucketName}" as "${fileName}"`);

    await uploadWithRetry(s3Client, {
      Bucket: config.bucketName,
      Key: `exports/${fileName}`,
      Body: exportData,
      ContentType: 'application/json',
    });

    // Success: update status and clear any previous error
    await withAdminTenantDb(orgId, async (tx) => {
      await tx
        .update(auditExportConfigs)
        .set({
          lastExportAt: now,
          exportStatus: "success",
          lastError: null,
          updatedAt: now,
        })
        .where(eq(auditExportConfigs.id, config.id));
    });

    return { success: true, count: logs.length, fileName };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown export error";
    console.error(`[Audit Exporter] Failed to upload logs for ${orgId}:`, errorMessage);

    // Persist error state so admin can see it in the dashboard
    try {
      await withAdminTenantDb(orgId, async (tx) => {
        await tx
          .update(auditExportConfigs)
          .set({
            exportStatus: "error",
            lastError: errorMessage.substring(0, 500),
            updatedAt: now,
          })
          .where(eq(auditExportConfigs.id, config.id));
      });
    } catch (dbError) {
      console.error(`[Audit Exporter] Could not persist error state:`, dbError);
    }

    throw error;
  }
}
