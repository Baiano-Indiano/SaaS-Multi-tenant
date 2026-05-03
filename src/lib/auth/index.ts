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

console.log("[Auth] Initializing betterAuth...");
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    "http://localhost:3000",
    "http://26.218.98.227:3000"
  ],
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
        
        // JIT Provisioning for SSO
        if (ctx.path?.includes("sso/callback")) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const user = (ctx.context as Record<string, any>)?.session?.user;
          if (user) {
            const domain = user.email.split("@")[1]?.toLowerCase();
            if (domain) {
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

                  const ip = ctx.headers?.get("x-forwarded-for") || ctx.headers?.get("x-real-ip") || undefined;
                  const userAgent = ctx.headers?.get("user-agent") || undefined;

                  recordAuditLog({
                    organizationId: domainRecord.organizationId,
                    action: "MEMBER_JIT_PROVISIONED",
                    entityType: "MEMBER",
                    entityId: user.id,
                    ip,
                    userAgent,
                    details: `Usuário provisionado via SSO (domínio: ${domain})`,
                    actor: {
                      id: user.id,
                      name: user.name,
                      email: user.email,
                    }
                  });
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