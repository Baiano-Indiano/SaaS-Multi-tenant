"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac-utils";
import { db } from "@/lib/db";
import { members, organizations, invitations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import postgres from "postgres";
import { PLANS, PlanType } from "@/lib/billing/plans";

const connectionString = process.env.DATABASE_URL!;

export async function updateMemberRoleAction(formData: {
  memberId: string;
  roleId: string;
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  // 1. Security Check: Actor must have roles:assign permission
  const allowed = await can(session.user.id, formData.orgId, "roles:assign");
  if (!allowed) throw new Error("Forbidden: Missing roles:assign permission");

  // 2. Validate Target Role exists in Tenant Schema
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, formData.orgId),
  });
  if (!org?.tenantSchemaName) throw new Error("Organization schema not found");

  const schema = org.tenantSchemaName;
  const client = postgres(connectionString, { prepare: false });

  try {
    const roleExists = await client`
      SELECT slug FROM ${client(schema)}.role WHERE id = ${formData.roleId}
    `.then(res => res.length > 0);

    if (!roleExists) throw new Error("Target role does not exist in this organization");

    // Get the slug of the new role for Better-Auth sync (optional but good)
    const newRole = await client`
      SELECT slug FROM ${client(schema)}.role WHERE id = ${formData.roleId}
    `.then(res => res[0]);

    // 3. Update Member in Public Schema
    await db.update(members)
      .set({ 
        roleId: formData.roleId,
        role: newRole.slug // Keep Better-Auth 'role' field in sync
      })
      .where(
        and(
          eq(members.id, formData.memberId),
          eq(members.organizationId, formData.orgId)
        )
      );

    revalidatePath(`/org/${formData.orgSlug}/members`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update member role:", error);
    throw new Error("Failed to update member role");
  } finally {
    await client.end();
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

  const allowed = await can(session.user.id, data.orgId, "members:invite");
  if (!allowed) throw new Error("Forbidden");

  // Validate Role in Tenant Schema
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, data.orgId),
  });
  if (!org?.tenantSchemaName) throw new Error("Organization schema not found");

  const planId = (org.plan?.toUpperCase() || "FREE") as PlanType;
  const currentPlan = PLANS[planId] || PLANS.FREE;

  const currentMembers = await db.query.members.findMany({
    where: eq(members.organizationId, data.orgId),
  });

  if (currentMembers.length >= currentPlan.maxMembers) {
    throw new Error(`Your ${currentPlan.name} plan only allows up to ${currentPlan.maxMembers} members.`);
  }

  const schema = org.tenantSchemaName;
  const client = postgres(connectionString, { prepare: false });

  try {
    const roleRes = await client`
      SELECT slug FROM ${client(schema)}.role WHERE id = ${data.roleId}
    `;
    if (roleRes.length === 0) throw new Error("Role not found");
    const roleSlug = roleRes[0].slug;

    // 1. Create invitation via Better-Auth
    const res = await auth.api.createInvitation({
      body: {
        email: data.email,
        role: roleSlug,
        organizationId: data.orgId,
      },
      headers: await headers(),
    });

    // 2. Add roleId to the record for RBAC synchronization
    if (res && res.id) {
      await db.update(invitations)
        .set({ roleId: data.roleId })
        .where(eq(invitations.id, res.id));
    }

    revalidatePath(`/org/${data.orgSlug}/members`);
    return { success: true };
  } catch (error) {
    console.error("Failed to invite member:", error);
    throw new Error("Failed to invite member");
  } finally {
    await client.end();
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
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    if (error instanceof Error) throw error;
    throw new Error("An error occurred while accepting the invitation.");
  } finally {
    await client.end();
  }

  redirect(`/org/${org.slug}`);
}
