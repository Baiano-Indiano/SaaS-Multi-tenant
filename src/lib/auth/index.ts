import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, customSession } from "better-auth/plugins";
import { db } from "../db";
import * as schema from "../db/schema";
import { PERMISSIONS_METADATA_KEY } from "./rbac-utils";
import { PermissionKey } from "./permissions";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

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
    schema: schema
  }),
  plugins: [
    organization({
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
      sendInvitationEmail: async (data) => {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${data.id}`;
        console.log("\n" + "=".repeat(50));
        console.log("📧 [MOCK EMAIL] Invitation Sent");
        console.log(`To: ${data.email}`);
        console.log(`Organization: ${data.organization.name}`);
        console.log(`Link: ${inviteLink}`);
        console.log("=".repeat(50) + "\n");
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
