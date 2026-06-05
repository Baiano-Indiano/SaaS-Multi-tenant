import { redis } from "../redis";
import { triggerAnomalyAlert } from "./anomaly-trigger";

/**
 * Logs a webhook delivery event in a sliding window Redis Sorted Set.
 * Prunes events older than 24 hours.
 */
export async function trackWebhookDelivery(organizationId: string): Promise<void> {
  const logKey = `org:${organizationId}:webhook_deliveries_log`;
  const now = Date.now();
  const oneDayAgo = now - 86400000;
  const uniqueValue = `${now}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // 1. Add current timestamp to ZSET
    await redis.zadd(logKey, { score: now, member: uniqueValue });
    
    // 2. Prune old records older than 24h
    await redis.zremrangebyscore(logKey, 0, oneDayAgo);
    
    // 3. Set expiration of 24h (86400 seconds) on the key
    await redis.expire(logKey, 86400);

    // 4. Perform dynamic real-time surge check
    await checkWebhookSurge(organizationId);

  } catch (error) {
    console.error(`[Webhook Tracker] Error tracking delivery for Org ${organizationId}:`, error);
  }
}

/**
 * Checks for webhook consumption surges using the sliding window log in Redis.
 * Evaluates: (last hour count) > 3 * (average per hour in last 24h) and (last hour count) >= 50.
 */
export async function checkWebhookSurge(organizationId: string): Promise<boolean> {
  const logKey = `org:${organizationId}:webhook_deliveries_log`;
  const now = Date.now();
  const oneHourAgo = now - 3600000;
  const oneDayAgo = now - 86400000;

  try {
    // 1. Prune old logs first to ensure accuracy
    await redis.zremrangebyscore(logKey, 0, oneDayAgo);

    // 2. Count deliveries in the last 24 hours
    const total24h = await redis.zcard(logKey);
    
    // 3. Count deliveries in the last 1 hour
    const count1h = await redis.zcount(logKey, oneHourAgo, now);

    const avgPerHour = total24h / 24.0;

    // Check thresholds: count1h >= 50 and count1h > 3 * avgPerHour
    if (count1h >= 50 && count1h > 3 * avgPerHour) {
      const details = `Tráfego de webhooks anômalo: ${count1h} disparos na última hora excedendo a média móvel das últimas 24h (${avgPerHour.toFixed(1)}/h) em mais de 300%.`;
      
      await triggerAnomalyAlert(organizationId, "WEBHOOK_SURGE", details);
      return true;
    }
  } catch (error) {
    console.error(`[Webhook Tracker] Error checking surge for Org ${organizationId}:`, error);
  }
  return false;
}
