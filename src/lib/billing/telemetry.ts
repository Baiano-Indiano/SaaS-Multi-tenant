import { redis } from "../redis";

/**
 * Prefix/Key pattern for telemetry data in Redis:
 * billing:usage:{orgId}:{metric}
 */
export function getTelemetryKey(orgId: string, metric: string): string {
  return `billing:usage:${orgId}:${metric}`;
}

/**
 * Increment organization usage counter in Redis atomically.
 */
export async function incrementUsage(orgId: string, metric: string, amount: number = 1): Promise<number> {
  const key = getTelemetryKey(orgId, metric);
  return await redis.incrby(key, amount);
}

/**
 * Get the current telemetry usage value from Redis.
 */
export async function getUsage(orgId: string, metric: string): Promise<number> {
  const key = getTelemetryKey(orgId, metric);
  const val = await redis.get<string | number>(key);
  if (val === null) return 0;
  return typeof val === "string" ? parseInt(val, 10) : (val as number);
}

/**
 * Atomically retrieve and reset the telemetry counter to 0.
 * Utilizes GETSET to prevent losing events during sync window.
 */
export async function flushUsage(orgId: string, metric: string): Promise<number> {
  const key = getTelemetryKey(orgId, metric);
  const oldVal = await redis.getset(key, 0);
  if (oldVal === null) return 0;
  return typeof oldVal === "string" ? parseInt(oldVal, 10) : (oldVal as number);
}
