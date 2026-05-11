"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { withAdminTenantDb } from "@/lib/db/tenant-db";
import { auditExportConfigs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/security/crypto";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { can } from "@/lib/auth/rbac-utils";
import { revalidatePath } from "next/cache";

export async function saveAuditExportConfig(params: {
  organizationId: string;
  bucketName: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  isActive: boolean;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const hasPermission = await can(session.user.id, params.organizationId, "security:manage");
  if (!hasPermission) throw new Error("Permission denied");

  // Validate S3 Connection before saving
  try {
    const s3Client = new S3Client({
      region: params.region || 'us-east-1',
      endpoint: params.endpoint || undefined,
      forcePathStyle: !!params.endpoint,
      credentials: {
        accessKeyId: params.accessKeyId,
        secretAccessKey: params.secretAccessKey,
      },
    });

    // Test connection by listing objects (minimal permission check)
    await s3Client.send(new ListObjectsV2Command({
      Bucket: params.bucketName,
      MaxKeys: 1,
    }));
  } catch (error) {
    console.error("S3 Connection Test Failed:", error);
    return { 
      success: false, 
      error: "Could not connect to S3 with provided credentials. Please check bucket name and permissions." 
    };
  }

  // Encrypt sensitive data
  const encryptedAccessKey = encrypt(params.accessKeyId);
  const encryptedSecretKey = encrypt(params.secretAccessKey);

  await withAdminTenantDb(params.organizationId, async (tx) => {
    // Check if config exists
    const existing = await tx
      .select()
      .from(auditExportConfigs)
      .limit(1);

    if (existing.length > 0) {
      await tx
        .update(auditExportConfigs)
        .set({
          bucketName: params.bucketName,
          region: params.region,
          endpoint: params.endpoint || null,
          accessKeyId: encryptedAccessKey,
          secretAccessKey: encryptedSecretKey,
          isActive: params.isActive,
          updatedAt: new Date(),
        })
        .where(eq(auditExportConfigs.id, existing[0].id));
    } else {
      await tx.insert(auditExportConfigs).values({
        id: `exp_${crypto.randomUUID()}`,
        type: "s3",
        bucketName: params.bucketName,
        region: params.region,
        endpoint: params.endpoint || null,
        accessKeyId: encryptedAccessKey,
        secretAccessKey: encryptedSecretKey,
        isActive: params.isActive,
        frequency: "daily",
      });
    }
  });

  revalidatePath(`/org/[orgSlug]/settings/security`, "page");
  return { success: true };
}

export async function getAuditExportConfig(organizationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const hasPermission = await can(session.user.id, organizationId, "security:manage");
  if (!hasPermission) return null;

  return await withAdminTenantDb(organizationId, async (tx) => {
    const results = await tx
      .select()
      .from(auditExportConfigs)
      .limit(1);
    
    if (results.length === 0) return null;
    
    // Return config but redact sensitive keys for the UI
    const config = results[0];
    return {
      ...config,
      accessKeyId: config.accessKeyId ? "********" : "",
      secretAccessKey: config.secretAccessKey ? "********" : "",
    };
  });
}
