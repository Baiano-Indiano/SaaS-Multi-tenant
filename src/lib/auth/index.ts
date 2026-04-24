import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, twoFactor, multiSession } from "better-auth/plugins";
import { db } from "../db";
import * as schema from "../db/schema";
import { recordAuditLog } from "../audit";

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
    },
  }),
  emailAndPassword: {
    enabled: true
  },
  plugins: [
    organization(),
    twoFactor({
      issuer: "Gravity SaaS",
    }),
    multiSession()
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
          details = "O usu\u00e1rio ativou a autentica\u00e7\u00e3o de dois fatores.";
        } else if (context.path.includes("two-factor/disable")) {
          action = "USER_2FA_DISABLED";
          details = "O usu\u00e1rio desativou a autentica\u00e7\u00e3o de dois fatores.";
        } else if (context.path.includes("multi-session/revoke-all")) {
          action = "USER_ALL_SESSIONS_REVOKED";
          details = "O usu\u00e1rio revogou todas as outras sess\u00f5es ativas.";
        } else if (context.path.includes("multi-session/revoke")) {
          action = "USER_SESSION_REVOKED";
          details = "O usu\u00e1rio revogou uma sess\u00e3o espec\u00edfica.";
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
    })
  }
});
