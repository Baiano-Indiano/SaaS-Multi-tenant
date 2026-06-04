"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organizations, users, sessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { recordAuditLog } from "@/lib/audit";
import { can } from "@/lib/auth/rbac-utils";
import { toggle2FAEnforcementSchema, check2FAComplianceSchema, updateDataRetentionSchema } from "@/lib/validations";
import { securityActionRateLimit, enforceRateLimit } from "@/lib/rate-limit";
import { redis } from "@/lib/redis";
import { l1Cache } from "@/lib/cache/l1-cache";
import { cookies } from "next/headers";
import { encrypt, decrypt } from "@/lib/security/crypto";

type SecurityActionResponse =
  | { success: true }
  | { success: false; error: string };

/**
 * Toggles 2FA enforcement for an organization.
 * Requires 'security:manage' permission.
 */
export async function toggle2FAEnforcementAction(organizationId: string, enabled: boolean, gracePeriodDays?: number | null) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  try {
    // Input Validation
    const validated = toggle2FAEnforcementSchema.parse({ organizationId, enabled, gracePeriodDays });
    organizationId = validated.organizationId;
    enabled = validated.enabled;
    const graceDays = validated.gracePeriodDays ?? 0;

    // Rate Limiting
    await enforceRateLimit(securityActionRateLimit, session.user.id);

    // 1. Verify Permission
    const allowed = await can(session.user.id, organizationId, "security:manage");
    if (!allowed) {
      return { success: false, error: "Você não tem permissão para gerenciar a segurança desta organização." };
    }

    // Fetch organization details to get the slug for cache updating/invalidation
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    const mfaEnforcedAtDate = enabled ? (org?.mfaEnforcedAt || new Date()) : null;

    // 2. Update organization
    await db.update(organizations)
      .set({ 
        require2FA: enabled,
        mfaGracePeriodDays: enabled ? graceDays : null,
        mfaEnforcedAt: mfaEnforcedAtDate,
      })
      .where(eq(organizations.id, organizationId));

    // Cache write-through
    const cacheData = { 
      require2FA: enabled, 
      id: organizationId, 
      plan: org?.plan || "free",
      mfaGracePeriodDays: enabled ? graceDays : null,
      mfaEnforcedAt: mfaEnforcedAtDate ? mfaEnforcedAtDate.toISOString() : null,
    };
    await redis.set(`org:${organizationId}`, cacheData);
    l1Cache.set(`org:${organizationId}`, cacheData);
    if (org?.slug) {
      await redis.set(`org:${org.slug}`, cacheData);
      l1Cache.set(`org:${org.slug}`, cacheData);
    }

    // 3. Record Audit Log
    await recordAuditLog({
      organizationId,
      action: enabled ? "2FA_ENFORCED" : "2FA_ENFORCEMENT_REMOVED",
      entityType: "ORGANIZATION",
      entityId: organizationId,
      details: `${enabled ? "Ativou" : "Desativou"} a obrigatoriedade de 2FA para a organização. Grace period: ${graceDays} dias.`,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to toggle 2FA enforcement:", error);
    return { success: false, error: "Falha ao atualizar configuração de segurança." };
  }
}

/**
 * Checks if a user is compliant with 2FA requirements for a specific organization.
 * Used to trigger interstitials or redirects.
 */
export async function check2FAComplianceAction(
  userId: string,
  organizationId: string
): Promise<{ isCompliant: boolean }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { isCompliant: true };
    }

    // Input Validation
    const validated = check2FAComplianceSchema.parse({ userId, organizationId });
    userId = validated.userId;
    organizationId = validated.organizationId;

    // Prevent IDOR: only allow checking own compliance or with security:manage
    if (session.user.id !== userId) {
      const canManage = await can(session.user.id, organizationId, "security:manage");
      if (!canManage) {
        return { isCompliant: true };
      }
    }

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    if (!org?.require2FA) {
      return { isCompliant: true };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    return { isCompliant: !!user?.twoFactorEnabled };
  } catch (error) {
    console.error("Failed to check 2FA compliance:", error);
    return { isCompliant: true };
  }
}

/**
 * Lists all active sessions for a specific member.
 * Requires 'security:manage' or 'members:remove' permission.
 */
export async function listMemberSessionsAction(
  organizationId: string,
  memberUserId: string
): Promise<{ success: true; sessions: Record<string, unknown>[] } | { success: false; error: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  try {
    // 1. Verify Permission
    const canManageSecurity = await can(session.user.id, organizationId, "security:manage");
    const canManageMembers = await can(session.user.id, organizationId, "members:remove");
    
    if (!canManageSecurity && !canManageMembers) {
      return { success: false, error: "Você não tem permissão para visualizar as sessões deste membro." };
    }

    // 2. Fetch sessions from DB
    const memberSessions = await db.query.sessions.findMany({
      where: eq(sessions.userId, memberUserId),
      orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
    });

    return { success: true, sessions: memberSessions };
  } catch (error) {
    console.error("Failed to list member sessions:", error);
    return { success: false, error: "Falha ao listar sessões do membro." };
  }
}

/**
 * Revokes all sessions for a specific member.
 * Requires 'security:manage' or 'members:remove' permission.
 */
export async function revokeMemberSessionsAction(
  organizationId: string,
  memberUserId: string,
  memberEmail: string
): Promise<SecurityActionResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  try {
    // 1. Verify Permission
    const canManageSecurity = await can(session.user.id, organizationId, "security:manage");
    const canManageMembers = await can(session.user.id, organizationId, "members:remove");
    
    if (!canManageSecurity && !canManageMembers) {
      return { success: false, error: "Você não tem permissão para revogar sessões deste membro." };
    }

    // 2. Delete all sessions for the user
    await db.delete(sessions)
      .where(eq(sessions.userId, memberUserId));

    // 3. Record Audit Log
    await recordAuditLog({
      organizationId,
      action: "MEMBER_SESSIONS_REVOKED",
      entityType: "USER",
      entityId: memberUserId,
      details: `Todas as sessões do membro ${memberEmail} foram revogadas.`,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to revoke member sessions:", error);
    return { success: false, error: "Falha ao revogar sessões do membro." };
  }
}

/**
 * Revokes a specific session by ID.
 * Requires 'security:manage' or 'members:remove' permission.
 */
export async function revokeMemberSessionAction(
  organizationId: string,
  memberUserId: string,
  sessionId: string,
  memberEmail: string
): Promise<SecurityActionResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  try {
    // 1. Verify Permission
    const canManageSecurity = await can(session.user.id, organizationId, "security:manage");
    const canManageMembers = await can(session.user.id, organizationId, "members:remove");
    
    if (!canManageSecurity && !canManageMembers) {
      return { success: false, error: "Você não tem permissão para revogar esta sessão." };
    }

    // 2. Delete specific session
    // Ensure the session actually belongs to the target user to prevent bypassing
    await db.delete(sessions)
      .where(
        and(
          eq(sessions.id, sessionId),
          eq(sessions.userId, memberUserId)
        )
      );

    // 3. Record Audit Log
    await recordAuditLog({
      organizationId,
      action: "MEMBER_SESSION_REVOKED",
      entityType: "SESSION",
      entityId: sessionId,
      details: `Uma sessão específica do membro ${memberEmail} foi revogada.`,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to revoke member session:", error);
    return { success: false, error: "Falha ao revogar sessão do membro." };
  }
}

/**
 * Updates data retention settings for an organization.
 * Requires 'security:manage' permission.
 */
export async function updateDataRetentionAction(
  organizationId: string,
  enabled: boolean,
  days: number | null
): Promise<SecurityActionResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  try {
    // Input Validation
    const validated = updateDataRetentionSchema.parse({ organizationId, enabled, days });
    organizationId = validated.organizationId;
    const finalDays = validated.enabled ? validated.days ?? null : null;

    // Rate Limiting
    await enforceRateLimit(securityActionRateLimit, session.user.id);

    // 1. Verify Permission
    const allowed = await can(session.user.id, organizationId, "security:manage");
    if (!allowed) {
      return { success: false, error: "Você não tem permissão para gerenciar a segurança desta organização." };
    }

    // Fetch organization details to get current fields (require2FA, plan, slug) for cache
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    if (!org) {
      return { success: false, error: "Organização não encontrada." };
    }

    // 2. Update organization
    await db.update(organizations)
      .set({ dataRetentionDays: finalDays })
      .where(eq(organizations.id, organizationId));

    // Cache write-through
    const cacheData = { 
      require2FA: org.require2FA, 
      id: organizationId, 
      plan: org.plan 
    };
    await redis.set(`org:${organizationId}`, cacheData);
    l1Cache.set(`org:${organizationId}`, cacheData);
    if (org.slug) {
      await redis.set(`org:${org.slug}`, cacheData);
      l1Cache.set(`org:${org.slug}`, cacheData);
    }

    // 3. Record Audit Log
    await recordAuditLog({
      organizationId,
      action: finalDays !== null ? "DATA_RETENTION_UPDATED" : "DATA_RETENTION_DISABLED",
      entityType: "ORGANIZATION",
      entityId: organizationId,
      details: finalDays !== null 
        ? `Atualizou a política de retenção de dados para ${finalDays} dias.` 
        : "Desativou a política de retenção de dados (retenção indefinita).",
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update data retention:", error);
    return { success: false, error: "Falha ao atualizar configuração de retenção de dados." };
  }
}

export async function trustDeviceAction() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const userId = session.user.id;
    const cookieStore = await cookies();
    const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 dias
    const payload = JSON.stringify({ userId, expiry });
    const encryptedPayload = encrypt(payload);

    cookieStore.set(`trusted-device-${userId}`, encryptedPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to trust device:", error);
    return { success: false, error: "Falha ao registrar dispositivo confiável." };
  }
}

export async function isDeviceTrustedAction(userId: string): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(`trusted-device-${userId}`);
    if (!cookie?.value) return false;

    const decrypted = decrypt(cookie.value);
    if (!decrypted) return false;

    const data = JSON.parse(decrypted);
    if (data.userId === userId && data.expiry > Date.now()) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
