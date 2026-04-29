import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, twoFactor, multiSession } from "better-auth/plugins";
import { sso } from "@better-auth/sso";
import { db } from "../db";
import * as schema from "../db/schema";
import { and, eq } from "drizzle-orm";
import { recordAuditLog } from "../audit";
import { v4 as uuidv4 } from "uuid";
import { redis } from "../redis";

export const auth = betterAuth({
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
    sso(),
    organization(),
    twoFactor({
      issuer: "Gravity SaaS",
    }),
    multiSession(),
  ],
  hooks: {
    after: createAuthMiddleware(async (context) => {
      if (context.path.includes("two-factor/enable") ||
        context.path.includes("two-factor/disable") ||
        context.path.includes("multi-session/revoke") ||
        context.path.includes("multi-session/revoke-all")) {

        const session = context.context.session;
        if (!session?.session?.activeOrganizationId || !session?.user) return;

        let action = "";
        let details = "";

        if (context.path.includes("two-factor/enable")) {
          action = "USER_2FA_ENABLED";
          details = "O usuário ativou a autenticação de dois fatores.";
          // Sync to Redis for proxy enforcement
          await redis.set(`user:${session.user.id}:mfa`, true);
        } else if (context.path.includes("two-factor/disable")) {
          action = "USER_2FA_DISABLED";
          details = "O usuário desativou a autenticação de dois fatores.";
          // Sync to Redis for proxy enforcement
          await redis.set(`user:${session.user.id}:mfa`, false);
        } else if (context.path.includes("multi-session/revoke-all")) {
          action = "USER_ALL_SESSIONS_REVOKED";
          details = "O usuário revogou todas as outras sessões ativas.";
        } else if (context.path.includes("multi-session/revoke")) {
          action = "USER_SESSION_REVOKED";
          details = "O usuário revogou uma sessão específica.";
        }

        if (!action) return;

        recordAuditLog({
          organizationId: session.session.activeOrganizationId,
          action,
          entityType: "USER",
          entityId: session.user.id,
          details,
          actor: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
          }
        });
      }

      // JIT Provisioning for SSO
      if (context.path.includes("sso/callback") && context.context.session?.user) {
        const user = context.context.session.user;
        const domain = user.email.split("@")[1]?.toLowerCase();

        if (domain) {
          const domainRecord = await db.query.organizationDomains.findFirst({
            where: and(
              eq(schema.organizationDomains.domain, domain),
              eq(schema.organizationDomains.isVerified, true)
            ),
          });

          if (domainRecord) {
            // Check if already a member
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

              // Optional: Log it
              recordAuditLog({
                organizationId: domainRecord.organizationId,
                action: "MEMBER_JIT_PROVISIONED",
                entityType: "MEMBER",
                entityId: user.id,
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
    })
  }
});