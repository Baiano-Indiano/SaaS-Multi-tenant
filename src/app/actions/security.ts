"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organizations, users, sessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { recordAuditLog } from "@/lib/audit";
import { can } from "@/lib/auth/rbac-utils";

type SecurityActionResponse =
  | { success: true }
  | { success: false; error: string };

/**
 * Toggles 2FA enforcement for an organization.
 * Requires 'security:manage' permission.
 */
export async function toggle2FAEnforcementAction(
  organizationId: string,
  enabled: boolean
): Promise<SecurityActionResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  try {
    // 1. Verify Permission
    const allowed = await can(session.user.id, organizationId, "security:manage");
    if (!allowed) {
      return { success: false, error: "Você não tem permissão para gerenciar a segurança desta organização." };
    }

    // 2. Update organization
    await db.update(organizations)
      .set({ require2FA: enabled })
      .where(eq(organizations.id, organizationId));

    // 3. Record Audit Log
    await recordAuditLog({
      organizationId,
      action: enabled ? "2FA_ENFORCED" : "2FA_ENFORCEMENT_REMOVED",
      entityType: "ORGANIZATION",
      entityId: organizationId,
      details: `${enabled ? "Ativou" : "Desativou"} a obrigatoriedade de 2FA para a organização.`,
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
