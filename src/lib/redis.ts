import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export interface ApiKeyData {
  orgId: string;
  tenantSchemaName: string;
  roleId: string;
  userId: string;
  scopes?: string[]; // Simplified: ['read', 'write']
}

export const API_KEY_REDIS_PREFIX = "api_key:";

export async function storeApiKeyInRedis(hash: string, data: ApiKeyData) {
  await redis.set(`${API_KEY_REDIS_PREFIX}${hash}`, data);
}

export async function removeApiKeyFromRedis(hash: string) {
  await redis.del(`${API_KEY_REDIS_PREFIX}${hash}`);
}

export async function getApiKeyFromRedis(hash: string) {
  return await redis.get<ApiKeyData>(`${API_KEY_REDIS_PREFIX}${hash}`);
}
