import { redis } from "../redis";
import { recordAuditLog } from "../audit";
import { sendNotification } from "../notifications";
import { createHash } from "crypto";
import { sendSecurityAlertEmail } from "../mail";

/**
 * Session Anomaly Detection Engine
 * 
 * Monitors IP and User-Agent fingerprints to detect suspicious logins.
 * 
 * Hardened with:
 * - Per-user email cooldown (30 min) to prevent alert spam during brute force
 */

const EMAIL_COOLDOWN_SECONDS = 30 * 60; // 30 minutes

export interface EnvironmentFingerprint {
  ip: string;
  userAgent: string;
}

/**
 * Generates a stable hash for an environment.
 */
export function getFingerprint(env: EnvironmentFingerprint): string {
  const data = `${env.ip}:${env.userAgent}`;
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Mock Geolocation (In production, use a service like ipapi.co or a MaxMind DB)
 */
function getMockLocation(ip: string): string {
  if (ip === "127.0.0.1" || ip === "::1") return "Localhost (Desenvolvimento)";
  if (ip.startsWith("192.168.") || ip.startsWith("10.")) return "Rede Local";
  
  // Example mock logic for the São Paulo/Russia scenario
  if (ip === "95.161.226.11") return "São Petersburgo, Rússia (SIMULADO)";
  if (ip === "177.126.180.12") return "São Paulo, Brasil (SIMULADO)";
  
  return "Localização Desconhecida";
}

/**
 * Detects if a login environment is known for the user.
 * If unknown, triggers alerts and audit logs.
 * 
 * Email alerts are rate-limited to 1 per 30 minutes per user to
 * prevent inbox flooding during brute force attacks.
 */
export async function detectSessionAnomaly(
  userId: string,
  env: EnvironmentFingerprint,
  userMetadata: { name: string; email: string; organizationId?: string }
) {
  const fingerprint = getFingerprint(env);
  const redisKey = `user:${userId}:envs`;

  // 1. Check if fingerprint is known
  const isKnown = await redis.sismember(redisKey, fingerprint);

  if (!isKnown) {
    console.log(`[Security] Anomaly detected for user ${userId}: New environment ${env.ip}`);

    // 2. Register new environment (after alert)
    // We store it so we don't spam alerts for the same new device
    await redis.sadd(redisKey, fingerprint);
    
    // 3. Record Audit Log (always fires — no cooldown)
    if (userMetadata.organizationId) {
      await recordAuditLog({
        organizationId: userMetadata.organizationId,
        action: "SECURITY_ANOMALY_DETECTED",
        entityType: "USER",
        entityId: userId,
        details: `Novo ambiente de login detectado: IP ${env.ip}, User-Agent: ${env.userAgent.substring(0, 100)}...`,
        ip: env.ip,
        userAgent: env.userAgent,
        actor: {
          id: userId,
          name: userMetadata.name,
          email: userMetadata.email,
        }
      });
    }

    // 4. Trigger In-App Notification (always fires — no cooldown)
    await sendNotification({
      userId,
      organizationId: userMetadata.organizationId,
      type: "SECURITY_ANOMALY",
      title: "Novo Login Detectado",
      message: `Um novo login foi realizado a partir de um ambiente não reconhecido (IP: ${env.ip}). Se não foi você, mude sua senha imediatamente.`,
    });

    // 5. Send Email Alert (rate-limited per user)
    const emailCooldownKey = `user:${userId}:anomaly_email_cooldown`;
    const isOnCooldown = await redis.get(emailCooldownKey);

    if (!isOnCooldown) {
      const location = getMockLocation(env.ip);
      await sendSecurityAlertEmail({
        to: userMetadata.email,
        userName: userMetadata.name,
        ip: env.ip,
        userAgent: env.userAgent,
        location,
      });

      // Set cooldown: no more emails for this user for 30 minutes
      await redis.set(emailCooldownKey, "1", { ex: EMAIL_COOLDOWN_SECONDS });
    } else {
      console.log(`[Security] Email alert suppressed for user ${userId} (cooldown active)`);
    }
    
    return { anomaly: true, fingerprint };
  }

  return { anomaly: false, fingerprint };
}

