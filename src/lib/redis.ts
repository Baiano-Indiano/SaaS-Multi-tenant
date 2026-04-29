import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

/**
 * API Key Redis Utilities
 * 
 * Storage pattern:
 * key: api_key:[hash] 
 * value: { orgId: string, tenantSchemaName: string, roleId: string }
 */

export const API_KEY_REDIS_PREFIX = "api_key:";

export async function storeApiKeyInRedis(hash: string, data: { orgId: string; tenantSchemaName: string; roleId: string; userId: string }) {
  await redis.set(`${API_KEY_REDIS_PREFIX}${hash}`, data);
}

export async function removeApiKeyFromRedis(hash: string) {
  await redis.del(`${API_KEY_REDIS_PREFIX}${hash}`);
}

export async function getApiKeyFromRedis(hash: string) {
  return await redis.get<{ orgId: string; tenantSchemaName: string; roleId: string; userId: string }>(`${API_KEY_REDIS_PREFIX}${hash}`);
}
