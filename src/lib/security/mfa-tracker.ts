import { redis } from "../redis";
import { db } from "../db";
import { members } from "../db/schema";
import { eq } from "drizzle-orm";
import { triggerAnomalyAlert } from "./anomaly-trigger";

/**
 * Tracks Totp / Backup Code failures in Upstash Redis and triggers alerts on spikes.
 * Checks both a 5-minute short window and a 24-hour long window.
 */
export async function trackMfaFailure(userId: string): Promise<void> {
  try {
    // 1. Get organizations user belongs to
    const memberships = await db
      .select({ organizationId: members.organizationId })
      .from(members)
      .where(eq(members.userId, userId));

    if (memberships.length === 0) return;

    const now = new Date();
    const currentMinute = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}:${now.getMinutes()}`;

    for (const membership of memberships) {
      const orgId = membership.organizationId;
      
      // Short window key (5 minutes)
      const shortKey = `org:${orgId}:mfa_failures_5m:${currentMinute}`;
      // Long window key (24 hours)
      const longKey = `org:${orgId}:mfa_failures_24h`;

      // Increment short key
      const shortCount = await redis.incr(shortKey);
      if (shortCount === 1) {
        await redis.expire(shortKey, 7200); // 2 hours expiration
      }

      // Increment long key
      const longCount = await redis.incr(longKey);
      if (longCount === 1) {
        await redis.expire(longKey, 86400); // 24 hours expiration
      }

      // Sum short window failures over the last 5 minutes
      let shortWindowSum = 0;
      const minutesToQuery: string[] = [];
      for (let i = 0; i < 5; i++) {
        const checkTime = new Date(now.getTime() - i * 60000);
        const minStr = `${checkTime.getFullYear()}-${checkTime.getMonth() + 1}-${checkTime.getDate()}_${checkTime.getHours()}:${checkTime.getMinutes()}`;
        minutesToQuery.push(`org:${orgId}:mfa_failures_5m:${minStr}`);
      }

      // Fetch values in batch
      const shortValues = await redis.mget<(string | null)[]>(...minutesToQuery);
      for (const val of shortValues) {
        if (val) shortWindowSum += Number(val);
      }

      // Evaluate anomaly thresholds
      if (shortWindowSum > 10) {
        await triggerAnomalyAlert(
          orgId,
          "MFA_SPIKE",
          `Pico crítico de falhas de autenticação de dois fatores detectado no curto prazo: ${shortWindowSum} tentativas malsucedidas nos últimos 5 minutos.`
        );
      } else if (longCount > 30) {
        await triggerAnomalyAlert(
          orgId,
          "MFA_SPIKE",
          `Aviso de segurança: Volume incomum de falhas de autenticação de dois fatores detectado nas últimas 24 horas: ${longCount} tentativas malsucedidas.`
        );
      }
    }
  } catch (error) {
    console.error("[MFA Tracker] Error tracking failure:", error);
  }
}
