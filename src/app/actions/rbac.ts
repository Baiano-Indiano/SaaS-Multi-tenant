"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac-utils";
import { getTenantDb } from "@/lib/db/tenant-db";
import { roles, rolePermissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { PermissionKey } from "@/lib/auth/permissions";
import { recordAuditLog } from "@/lib/audit";

/**
 * Creates a new custom role within the organization's tenant schema.
 */
export async function createRoleAction(formData: {
  name: string;
  slug: string;
  description: string;
  permissions: PermissionKey[];
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  // Step 1: Permission & Tenant Validation (Rules 1 & 2)
  return await getTenantDb(session.user.id, formData.orgId, async (tx) => {
    // Verify user has 'roles:manage' permission in this context
    await requirePermission(session.user.id, formData.orgId, "roles:manage");

    const roleId = randomUUID();

    // 1. Create the role
    await tx.insert(roles).values({
      id: roleId,
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
    });

    // 2. Assign permissions
    if (formData.permissions.length > 0) {
      const permsToInsert = formData.permissions.map(p => ({
        roleId,
        permissionKey: p,
      }));
      await tx.insert(rolePermissions).values(permsToInsert);
    }

    revalidatePath(`/org/${formData.orgSlug}/settings/roles`);

    // Record Audit Log (Phase 11)
    await recordAuditLog({
      organizationId: formData.orgId,
      action: "ROLE_CREATED",
      entityType: "ROLE",
      entityId: roleId,
      details: `Criou a role customizada: ${formData.name} (${formData.slug})`
    });

    return { success: true };
  });
}

/**
 * Updates an existing custom role's details and permissions.
 * System roles (admin, member, viewer) are protected.
 */
export async function updateRoleAction(formData: {
  id: string;
  name: string;
  description: string;
  permissions: PermissionKey[];
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  return await getTenantDb(session.user.id, formData.orgId, async (tx) => {
    await requirePermission(session.user.id, formData.orgId, "roles:manage");

    // Security check: Verify if the role is a protected system role
    const existingRole = await tx.query.roles.findFirst({
      where: eq(roles.id, formData.id),
    });

    if (!existingRole) throw new Error("Role not found");
    if (['admin', 'member', 'viewer', 'owner'].includes(existingRole.slug)) {
      throw new Error("System roles are immutable and cannot be edited");
    }

    // 1. Update role base details
    await tx.update(roles)
      .set({
        name: formData.name,
        description: formData.description,
      })
      .where(eq(roles.id, formData.id));

    // 2. Sync permissions (Delete and Re-insert strategy)
    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, formData.id));

    if (formData.permissions.length > 0) {
      const permsToInsert = formData.permissions.map(p => ({
        roleId: formData.id,
        permissionKey: p,
      }));
      await tx.insert(rolePermissions).values(permsToInsert);
    }

    revalidatePath(`/org/${formData.orgSlug}/settings/roles`);

    // Record Audit Log (Phase 11)
    await recordAuditLog({
      organizationId: formData.orgId,
      action: "ROLE_UPDATED",
      entityType: "ROLE",
      entityId: formData.id,
      details: `Atualizou a role: ${formData.name}`
    });

    return { success: true };
  });
}

/**
 * Deletes a custom role from the organization.
 * System roles are protected.
 */
export async function deleteRoleAction(roleId: string, orgId: string, orgSlug: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  return await getTenantDb(session.user.id, orgId, async (tx) => {
    await requirePermission(session.user.id, orgId, "roles:manage");

    // Security check: Verify if the role is a protected system role
    const existingRole = await tx.query.roles.findFirst({
      where: eq(roles.id, roleId),
    });

    if (!existingRole) throw new Error("Role not found");
    if (['admin', 'member', 'viewer', 'owner'].includes(existingRole.slug)) {
      throw new Error("System roles are immutable and cannot be deleted");
    }

    // Delete role (cascading into rolePermissions due to schema constraints)
    await tx.delete(roles).where(eq(roles.id, roleId));

    revalidatePath(`/org/${orgSlug}/settings/roles`);

    // Record Audit Log (Phase 11)
    await recordAuditLog({
      organizationId: orgId,
      action: "ROLE_DELETED",
      entityType: "ROLE",
      entityId: roleId,
      details: `Removeu a role customizada da organização`
    });

    return { success: true };
  });
}
