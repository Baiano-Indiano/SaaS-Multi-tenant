import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, customSession } from "better-auth/plugins";
import { db } from "../db";
import * as schema from "../db/schema";
import { PERMISSIONS_METADATA_KEY } from "./rbac-utils";
import { PermissionKey } from "./permissions";
import postgres from "postgres";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "dummy_key");
const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/saas_db";

interface AuthSession {
  id: string;
  userId: string;
  activeOrganizationId?: string | null;
  metadata?: Record<string, unknown> | null;
  expiresAt: Date;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
    usePlural: true
  }),
  plugins: [
    organization({
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
      sendInvitationEmail: async (data) => {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${data.id}`;

        if (process.env.RESEND_API_KEY) {
          try {
            await resend.emails.send({
              from: process.env.EMAIL_FROM || "SaaS-Starter <onboarding@resend.dev>",
              to: data.email,
              subject: `You have been invited to join ${data.organization.name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
                  <div style="background-color: #09090b; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Join ${data.organization.name}</h1>
                  </div>
                  <div style="padding: 24px; background-color: #ffffff; color: #18181b;">
                    <p style="font-size: 16px; line-height: 24px;">Hello there,</p>
                    <p style="font-size: 16px; line-height: 24px;">You have been invited by <strong>${data.inviter.user.name || data.inviter.user.email}</strong> to join the <strong>${data.organization.name}</strong> organization.</p>
                    <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
                      <a href="${inviteLink}" style="background-color: #09090b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px; display: inline-block;">Accept Invitation</a>
                    </div>
                    <p style="font-size: 14px; color: #71717a;">If you did not expect this invitation, you can ignore this email.</p>
                  </div>
                </div>
              `,
            });
            console.log(`📧 Invitation email sent to ${data.email} via Resend.`);
          } catch (error) {
            console.error("❌ Failed to send invitation email via Resend:", error);
          }
        } else {
          // Fallback to console mock for local DX
          console.log("\n" + "=".repeat(50));
          console.log("📧 [MOCK EMAIL] Invitation Sent (Add RESEND_API_KEY to send real emails)");
          console.log(`To: ${data.email}`);
          console.log(`Organization: ${data.organization.name}`);
          console.log(`Link: ${inviteLink}`);
          console.log("=".repeat(50) + "\n");
        }
      },
    }),
    customSession(async ({ user, session: baseSession }) => {
      const session = baseSession as AuthSession;
      const activeOrgId = session.activeOrganizationId;
      if (!activeOrgId) return { user, session: baseSession };

      // Fetch permissions for the user in the active organization
      const member = await db.query.members.findFirst({
        where: (members, { and, eq }) => and(
          eq(members.userId, user.id),
          eq(members.organizationId, activeOrgId)
        ),
        with: { organization: true }
      });

      if (!member || !member.roleId || !member.organization.tenantSchemaName) return { user, session };

      const tenantSchema = member.organization.tenantSchemaName;
      const client = postgres(connectionString, { prepare: false, max: 1 });
      
      try {
        const rows = await client`
          SELECT "permissionKey"
          FROM ${client(tenantSchema)}.role_permission
          WHERE "roleId" = ${member.roleId}
        `;
        
        const permissions = rows.map(r => r.permissionKey) as PermissionKey[];
        
        return {
          user,
          session: {
            ...session,
            metadata: {
              ...(session.metadata || {}),
              [PERMISSIONS_METADATA_KEY]: permissions
            }
          } as AuthSession
        };
      } catch (error) {
        console.error("Error fetching permissions in customSession:", error);
        return { user, session };
      } finally {
        await client.end();
      }
    })
  ],
  emailAndPassword: {
    enabled: true
  }
});
