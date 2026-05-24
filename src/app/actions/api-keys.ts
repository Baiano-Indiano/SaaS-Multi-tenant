"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTenantDb } from "@/lib/db/tenant-db";
import { apiKeys } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateApiKey, hashApiKey, getApiKeyDisplayPrefix } from "@/lib/auth/api-key";
import { recordAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/rbac-utils";
import { storeApiKeyInRedis, removeApiKeyFromRedis } from "@/lib/redis";
import { l1Cache } from "@/lib/cache/l1-cache";
import { organizations } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { createApiKeySchema, deleteApiKeySchema } from "@/lib/validations";
import { enforceRateLimit, apiKeyActionRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

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

  const _start = Date.now();
  logger.info('action', `➜ createApiKeyAction | user: ${session.user.id} | org: ${data.orgId}`);

  try {
    // Rate Limiting
    await enforceRateLimit(apiKeyActionRateLimit, session.user.id);

    // Input Validation
    const validated = createApiKeySchema.parse(data);

    // RBAC: Verify user has permission to manage API keys
    await requirePermission(session.user.id, validated.orgId, "org:update");

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
      const apiMetadata = {
        orgId: data.orgId,
        tenantSchemaName: org.tenantSchemaName,
        roleId: data.roleId,
        userId: session.user.id,
        scopes: ["read", "write"], // Default simplified scope
        plan: org.plan,            // Store current plan for tiered rate limiting
      };
      await storeApiKeyInRedis(keyHash, apiMetadata);
      l1Cache.set(`api_key:${keyHash}`, apiMetadata);
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

    logger.info('action', `✓ createApiKeyAction completed | keyId: ${result.key.id} | ${Date.now() - _start}ms`);

    return { 
      success: true, 
      id: result.key.id,
      rawKey // The gold standard: returned only once
    };
  } catch (error) {
    logger.error('action', `✗ createApiKeyAction failed | ${error instanceof Error ? error.message : 'Unknown error'} | ${Date.now() - _start}ms`, error);
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

  const _start = Date.now();
  logger.info('action', `➜ deleteApiKeyAction | user: ${session.user.id} | org: ${data.orgId}`);

  try {
    // Rate Limiting
    await enforceRateLimit(apiKeyActionRateLimit, session.user.id);

    // Input Validation
    const validated = deleteApiKeySchema.parse(data);

    // RBAC: Verify user has permission to manage API keys
    await requirePermission(session.user.id, validated.orgId, "org:update");

    const result = await getTenantDb(session.user.id, data.orgId, async (tx) => {
      const deletedKey = await tx.delete(apiKeys)
        .where(eq(apiKeys.id, data.keyId))
        .returning({ keyHash: apiKeys.keyHash });
      
      return deletedKey[0];
    });

    // 2. Sync removal to Redis and evict from L1 cache
    if (result?.keyHash) {
      await removeApiKeyFromRedis(result.keyHash);
      l1Cache.delete(`api_key:${result.keyHash}`);
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

    logger.info('action', `✓ deleteApiKeyAction completed | keyId: ${data.keyId} | ${Date.now() - _start}ms`);

    return { success: true };
  } catch (error) {
    logger.error('action', `✗ deleteApiKeyAction failed | ${error instanceof Error ? error.message : 'Unknown error'} | ${Date.now() - _start}ms`, error);
    return { error: "Failed to delete API key" };
  }
}

/**
 * getApiKeysAction
 */
export async function getApiKeysAction(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const _start = Date.now();
  logger.info('action', `➜ getApiKeysAction | user: ${session.user.id} | org: ${orgId}`);

  try {
    // RBAC: Verify user has permission to view API keys
    await requirePermission(session.user.id, orgId, "org:update");

    const keys = await getTenantDb(session.user.id, orgId, async (tx) => {
      return await tx.select().from(apiKeys).orderBy(apiKeys.createdAt);
    }, { mode: 'reader' });

    logger.info('action', `✓ getApiKeysAction completed | count: ${keys.length} | ${Date.now() - _start}ms`);

    return keys;
  } catch (error) {
    logger.error('action', `✗ getApiKeysAction failed | ${error instanceof Error ? error.message : 'Unknown error'} | ${Date.now() - _start}ms`, error);
    return [];
  }
}
