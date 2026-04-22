"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTenantDb } from "@/lib/db/tenant-db";
import { db } from "@/lib/db";
import { roles as rolesTable, members, organizations, invitations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { PLANS, PlanType } from "@/lib/billing/plans";
import { can } from "@/lib/auth/rbac-utils";
import postgres from "postgres";
import { recordAuditLog } from "@/lib/audit";

const connectionString = process.env.DATABASE_URL!;

export async function updateMemberRoleAction(formData: {
  memberId: string;
  roleId: string;
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    // getTenantDb performs the Membership check (Rule 1)
    await getTenantDb(session.user.id, formData.orgId, async (tx) => {
      // 1. Verify Target Role exists in Tenant Schema
      const targetRole = await tx.query.roles.findFirst({
        where: eq(rolesTable.id, formData.roleId),
      });
      
      if (!targetRole) throw new Error("Target role does not exist in this organization");

      // 2. Update Member in Public Schema (available via the 'public' fallback in search_path)
      await tx.update(members)
        .set({ 
          roleId: formData.roleId,
          role: targetRole.slug 
        })
        .where(
          and(
            eq(members.id, formData.memberId),
            eq(members.organizationId, formData.orgId)
          )
        );
    });

    revalidatePath(`/org/${formData.orgSlug}/members`);

    // Record Audit Log (Phase 11)
    await recordAuditLog({
      organizationId: formData.orgId,
      action: "MEMBER_ROLE_UPDATED",
      entityType: "MEMBER",
      entityId: formData.memberId,
      details: `Updated member role to ID: ${formData.roleId}`
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update member role:", error);
    throw error;
  }
}

export async function removeMemberAction(memberId: string, orgId: string, orgSlug: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const allowed = await can(session.user.id, orgId, "members:remove");
  if (!allowed) throw new Error("Forbidden");

  try {
    // Prevent removing the last admin (complex check, for now simple delete)
    // In a real app, you'd check if this is the only admin.

    await db.delete(members)
      .where(
        and(
          eq(members.id, memberId),
          eq(members.organizationId, orgId)
        )
      );

    revalidatePath(`/org/${orgSlug}/members`);

    // Record Audit Log (Phase 11)
    await recordAuditLog({
      organizationId: orgId,
      action: "MEMBER_REMOVED",
      entityType: "MEMBER",
      entityId: memberId,
      details: `Removed member from organization`
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to remove member:", error);
    throw new Error("Failed to remove member");
  }
}

export async function inviteMemberAction(data: {
  email: string;
  roleId: string;
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    const result = await getTenantDb(session.user.id, data.orgId, async (tx) => {
      // 1. Plan validation
      const org = await tx.query.organizations.findFirst({
        where: eq(organizations.id, data.orgId),
      });
      
      const planId = (org?.plan?.toUpperCase() || "FREE") as PlanType;
      const currentPlan = PLANS[planId] || PLANS.FREE;

      const currentMembers = await tx.query.members.findMany({
        where: eq(members.organizationId, data.orgId),
      });

      if (currentMembers.length >= currentPlan.maxMembers) {
        return { error: "QUOTA_EXCEEDED" };
      }

      // 2. Validate Role
      const targetRole = await tx.query.roles.findFirst({
        where: eq(rolesTable.id, data.roleId),
      });
      if (!targetRole) throw new Error("Role not found");

      // 3. Create invitation via Better-Auth
      const res = await auth.api.createInvitation({
        body: {
          email: data.email,
          role: targetRole.slug as "member" | "admin" | "owner",
          organizationId: data.orgId,
        },
        headers: await headers(),
      }) as { id: string };

      // 4. Add roleId to the record for RBAC synchronization
      if (res && res.id) {
        await tx.update(invitations)
          .set({ roleId: data.roleId })
          .where(eq(invitations.id, res.id));
      }

      return { success: true };
    });

    revalidatePath(`/org/${data.orgSlug}/members`);

    // Record Audit Log (Phase 11)
    await recordAuditLog({
      organizationId: data.orgId,
      action: "MEMBER_INVITED",
      entityType: "INVITATION",
      details: `Invited user ${data.email} to the organization`
    });

    return result;
  } catch (error) {
    console.error("Failed to invite member:", error);
    throw error;
  }
}

export async function cancelInvitationAction(id: string, orgId: string, orgSlug: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const allowed = await can(session.user.id, orgId, "members:invite");
  if (!allowed) throw new Error("Forbidden");

  try {
    await auth.api.cancelInvitation({
      body: {
        invitationId: id,
      },
      headers: await headers()
    });

    revalidatePath(`/org/${orgSlug}/members`);

    // Record Audit Log (Phase 11)
    await recordAuditLog({
      organizationId: orgId,
      action: "INVITATION_CANCELLED",
      entityType: "INVITATION",
      entityId: id,
      details: `Cancelled pending invitation`
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to cancel invitation:", error);
    throw new Error("Failed to cancel invitation");
  }
}

export async function getPendingInvitationsAction(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  return db.query.invitations.findMany({
    where: and(
      eq(invitations.organizationId, orgId),
      eq(invitations.status, "pending")
    ),
  });
}

export async function acceptInvitationAction(invitationId: string) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  
  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in to accept an invitation.");
  }

  // 1. Fetch Invitation
  const invite = await db.query.invitations.findFirst({
    where: eq(invitations.id, invitationId),
    with: { organization: true }
  });

  if (!invite) throw new Error("Invitation not found or already processed.");
  if (invite.status !== "pending") throw new Error("This invitation is no longer active.");
  if (invite.email !== session.user.email) {
    throw new Error(`This invitation is for ${invite.email}, but you are logged in as ${session.user.email}.`);
  }

  // 2. Security Check: Verify Role still exists in Tenant Schema
  const org = invite.organization;
  if (!org.tenantSchemaName) throw new Error("Organization context is invalid.");
  
  const schema = org.tenantSchemaName;
  const client = postgres(connectionString, { prepare: false });

  try {
    if (invite.roleId) {
      const roleRes = await client`
        SELECT id FROM ${client(schema)}.role WHERE id = ${invite.roleId}
      `;
      if (roleRes.length === 0) {
        throw new Error("O contexto deste convite foi alterado pela administração. Por favor, solicite um novo acesso.");
      }
    }

    // 3. Accept Invitation via Better-Auth
    await auth.api.acceptInvitation({
      body: { invitationId },
      headers: h,
    });

    // 4. Sync roleId to the newly created member record
    // We fetch the member record for this user in this org
    const newMember = await db.query.members.findFirst({
      where: and(
        eq(members.userId, session.user.id),
        eq(members.organizationId, org.id)
      )
    });

    if (newMember && invite.roleId) {
      await db.update(members)
        .set({ roleId: invite.roleId })
        .where(eq(members.id, newMember.id));
    }

    // Redirect to Org Dashboard
    // We don't return here because redirect throws a special error in Next.js
    // Record Audit Log (Phase 11)
    await recordAuditLog({
      organizationId: org.id,
      action: "INVITATION_ACCEPTED",
      entityType: "MEMBER",
      entityId: session.user.id,
      details: `Accepted invitation to join the organization`
    });

  } catch (error) {
    console.error("Failed to accept invitation:", error);
    if (error instanceof Error) throw error;
    throw new Error("An error occurred while accepting the invitation.");
  } finally {
    await client.end();
  }

  redirect(`/org/${org.slug}`);
}
