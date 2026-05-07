"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTenantDb } from "@/lib/db/tenant-db";
import { apiKeys } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateApiKey, hashApiKey, getApiKeyDisplayPrefix } from "@/lib/auth/api-key";
import { recordAuditLog } from "@/lib/audit";
import { storeApiKeyInRedis, removeApiKeyFromRedis } from "@/lib/redis";
import { organizations } from "@/lib/db/schema";
import { db } from "@/lib/db";

/**
 * createApiKeyAction
 * 
 * Generates a new API Key, hashes it, and stores it in the tenant schema.
 * Returns the RAW key only once.
 */
export async function createApiKeyAction(data: {
  name: string;
  roleId: string;
  orgId: string;
  orgSlug: string;
  expiresInDays?: number;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    const rawKey = generateApiKey();
    const keyHash = await hashApiKey(rawKey);
    const keyPrefix = getApiKeyDisplayPrefix(rawKey);

    // Calculate expiration date
    let expiresAt: Date | null = null;
    if (data.expiresInDays && data.expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);
    }

    const result = await getTenantDb(session.user.id, data.orgId, async (tx) => {
      const newKey = await tx.insert(apiKeys).values({
        id: crypto.randomUUID(),
        name: data.name,
        keyHash,
        keyPrefix,
        roleId: data.roleId,
        expiresAt,
      }).returning();

      return { success: true, key: newKey[0] };
    });

    // 2. Sync to Redis for high-performance middleware lookup
    // Fetch tenant schema name to store in metadata
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, data.orgId),
    });

    if (org?.tenantSchemaName) {
      await storeApiKeyInRedis(keyHash, {
        orgId: data.orgId,
        tenantSchemaName: org.tenantSchemaName,
        roleId: data.roleId,
        userId: session.user.id,
        scopes: ["read", "write"], // Default simplified scope
      });
    }

    // Record Audit Log
    await recordAuditLog({
      organizationId: data.orgId,
      action: "API_KEY_CREATED",
      entityType: "API_KEY",
      entityId: result.key.id,
      details: `Created API key "${data.name}" (Prefix: ${keyPrefix})`
    });

    revalidatePath(`/org/${data.orgSlug}/settings/api-keys`);

    return { 
      success: true, 
      id: result.key.id,
      rawKey // The gold standard: returned only once
    };
  } catch (error) {
    console.error("Failed to create API key:", error);
    return { error: "Failed to create API key" };
  }
}

/**
 * deleteApiKeyAction
 */
export async function deleteApiKeyAction(data: {
  keyId: string;
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    const result = await getTenantDb(session.user.id, data.orgId, async (tx) => {
      const deletedKey = await tx.delete(apiKeys)
        .where(eq(apiKeys.id, data.keyId))
        .returning({ keyHash: apiKeys.keyHash });
      
      return deletedKey[0];
    });

    // 2. Sync removal to Redis
    if (result?.keyHash) {
      await removeApiKeyFromRedis(result.keyHash);
    }

    // Record Audit Log
    await recordAuditLog({
      organizationId: data.orgId,
      action: "API_KEY_DELETED",
      entityType: "API_KEY",
      entityId: data.keyId,
      details: `Deleted API key (ID: ${data.keyId})`
    });

    revalidatePath(`/org/${data.orgSlug}/settings/api-keys`);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete API key:", error);
    return { error: "Failed to delete API key" };
  }
}

/**
 * getApiKeysAction
 */
export async function getApiKeysAction(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    return await getTenantDb(session.user.id, orgId, async (tx) => {
      return await tx.select().from(apiKeys).orderBy(apiKeys.createdAt);
    });
  } catch (error) {
    console.error("Failed to fetch API keys:", error);
    return [];
  }
}
