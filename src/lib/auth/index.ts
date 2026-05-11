// @ts-expect-error - TS bypass para o export do betterAuth no modo bundler
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, twoFactor, multiSession } from "better-auth/plugins";
import { sso } from "@better-auth/sso";
import { db } from "../db";
import * as schema from "../db/schema";
import { and, eq } from "drizzle-orm";
import { recordAuditLog } from "../audit";
import { v4 as uuidv4 } from "uuid";
import { redis } from "../redis";
import type { HookEndpointContext } from "@better-auth/core";
import { detectSessionAnomaly } from "../security/anomaly-detection";

console.log("[Auth] Initializing betterAuth...");
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    "http://localhost:3000",
    "http://26.218.98.227:3000",
    process.env.BETTER_AUTH_URL || "",
    process.env.NEXT_PUBLIC_APP_URL || ""
  ].filter(Boolean),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      organization: schema.organizations,
      member: schema.members,
      invitation: schema.invitations,
      ssoProvider: schema.ssoProviders,
      twoFactor: schema.twoFactors,
    },
  }),
  emailAndPassword: {
    enabled: true
  },
  plugins: [
    nextCookies(),
    sso(),
    organization(),
    twoFactor({
      issuer: "Gravity SaaS",
    }),
    multiSession(),
  ],
  hooks: {
    after: async (ctx: HookEndpointContext) => {
      try {
        if (!ctx) return {};
        
        // Handle audit logging for specific security actions
        if (ctx.path?.includes("sign-in/") || ctx.path?.includes("callback")) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const session = (ctx.context as Record<string, any>)?.session;
          if (session?.user) {
            const ip = ctx.headers?.get("x-forwarded-for") || ctx.headers?.get("x-real-ip") || "unknown";
            const userAgent = ctx.headers?.get("user-agent") || "unknown";
            
            await detectSessionAnomaly(session.user.id, { ip, userAgent }, {
              name: session.user.name,
              email: session.user.email,
              organizationId: session.session.activeOrganizationId
            });
          }
        }

        // Handle audit logging for specific security actions
        if (ctx.path?.includes("two-factor/enable") ||
          ctx.path?.includes("two-factor/disable") ||
          ctx.path?.includes("multi-session/revoke") ||
          ctx.path?.includes("multi-session/revoke-all")) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const session = (ctx.context as Record<string, any>)?.session;
          if (!session?.session?.activeOrganizationId || !session?.user) return {};

          let action = "";
          let details = "";

          if (ctx.path.includes("two-factor/enable")) {
            action = "USER_2FA_ENABLED";
            details = "O usuário ativou a autenticação de dois fatores.";
            await redis.set(`user:${session.user.id}:mfa`, true);
          } else if (ctx.path.includes("two-factor/verify")) {
             // Quando verifica o TOTP, o 2FA está oficialmente ativo
             await db.update(schema.users)
               .set({ twoFactorEnabled: true })
               .where(eq(schema.users.id, session.user.id));
          } else if (ctx.path.includes("two-factor/disable")) {
            action = "USER_2FA_DISABLED";
            details = "O usuário desativou a autenticação de dois fatores.";
            await redis.set(`user:${session.user.id}:mfa`, false);
          } else if (ctx.path.includes("multi-session/revoke-all")) {
            action = "USER_ALL_SESSIONS_REVOKED";
            details = "O usuário revogou todas as outras sessões ativas.";
          } else if (ctx.path.includes("multi-session/revoke")) {
            action = "USER_SESSION_REVOKED";
            details = "O usuário revogou uma sessão específica.";
          }

          if (action) {
            const ip = ctx.headers?.get("x-forwarded-for") || ctx.headers?.get("x-real-ip") || undefined;
            const userAgent = ctx.headers?.get("user-agent") || undefined;

            recordAuditLog({
              organizationId: session.session.activeOrganizationId,
              action,
              entityType: "USER",
              entityId: session.user.id,
              details,
              ip,
              userAgent,
              actor: {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
              }
            });
          }
        }
        
        // JIT Provisioning / Auto-Accept Invite for SSO
        if (ctx.path?.includes("sso/callback")) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const user = (ctx.context as Record<string, any>)?.session?.user;
          if (user) {
            const domain = user.email.split("@")[1]?.toLowerCase();
            if (domain) {
              // 1. Check if domain is verified for JIT provisioning
              const domainRecord = await db.query.organizationDomains.findFirst({
                where: and(
                  eq(schema.organizationDomains.domain, domain),
                  eq(schema.organizationDomains.isVerified, true)
                ),
              });

              if (domainRecord) {
                const existingMember = await db.query.members.findFirst({
                  where: and(
                    eq(schema.members.organizationId, domainRecord.organizationId),
                    eq(schema.members.userId, user.id)
                  ),
                });

                if (!existingMember) {
                  await db.insert(schema.members).values({
                    id: uuidv4(),
                    organizationId: domainRecord.organizationId,
                    userId: user.id,
                    role: "member",
                    createdAt: new Date(),
                  });

                  await recordAuditLog({
                    organizationId: domainRecord.organizationId,
                    action: "MEMBER_JIT_PROVISIONED",
                    entityType: "MEMBER",
                    entityId: user.id,
                    details: `Usuário provisionado via SSO (domínio verificado: ${domain})`,
                    actor: { id: user.id, name: user.name, email: user.email }
                  });
                }
              } 
              // 2. Fallback: Check for explicit pending invitations if domain not verified
              else {
                const pendingInvite = await db.query.invitations.findFirst({
                  where: and(
                    eq(schema.invitations.email, user.email),
                    eq(schema.invitations.status, "pending")
                  ),
                });

                if (pendingInvite) {
                  const existingMember = await db.query.members.findFirst({
                    where: and(
                      eq(schema.members.organizationId, pendingInvite.organizationId),
                      eq(schema.members.userId, user.id)
                    ),
                  });

                  if (!existingMember) {
                    await db.insert(schema.members).values({
                      id: uuidv4(),
                      organizationId: pendingInvite.organizationId,
                      userId: user.id,
                      role: pendingInvite.role || "member",
                      roleId: pendingInvite.roleId,
                      createdAt: new Date(),
                    });

                    // Consume invitation
                    await db.update(schema.invitations)
                      .set({ status: "accepted" })
                      .where(eq(schema.invitations.id, pendingInvite.id));

                    await recordAuditLog({
                      organizationId: pendingInvite.organizationId,
                      action: "MEMBER_SSO_INVITE_ACCEPTED",
                      entityType: "MEMBER",
                      entityId: user.id,
                      details: `Usuário aceito via SSO por convite prévio (domínio não verificado: ${domain})`,
                      actor: { id: user.id, name: user.name, email: user.email }
                    });
                  }
                } else {
                  console.warn(`[SSO Security] Attempted login from domain ${domain} by ${user.email} with no verification or invite.`);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("[Better Auth Hook Error]:", err);
      }
      return {};
    }

  }
});