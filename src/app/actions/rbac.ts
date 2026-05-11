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
import { createRoleSchema, updateRoleSchema, deleteRoleSchema, syncRolePermissionsSchema } from "@/lib/validations";

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
    // Input Validation
    const validated = createRoleSchema.parse(formData);

    // Verify user has 'roles:manage' permission in this context
    await requirePermission(session.user.id, validated.orgId, "roles:manage");

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
      details: `Created custom role: ${formData.name} (${formData.slug})`
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
    // Input Validation
    const validated = updateRoleSchema.parse(formData);

    await requirePermission(session.user.id, validated.orgId, "roles:manage");

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
      details: `Updated role: ${formData.name}`
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
    // Input Validation
    const validated = deleteRoleSchema.parse({ roleId, orgId, orgSlug });

    await requirePermission(session.user.id, validated.orgId, "roles:manage");

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
      details: `Removed custom role from organization`
    });

    return { success: true };
  });
}

/**
 * Synchronizes the permissions of standard roles (admin, member, viewer)
 * for a specific organization with the defaults defined in the code.
 */
export async function syncRolePermissionsAction(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  return await getTenantDb(session.user.id, orgId, async (tx) => {
    // Input Validation
    const validated = syncRolePermissionsSchema.parse({ orgId });

    // Security: Require roles:manage permission to prevent unauthorized permission resets.
    // This was previously skipped with a TODO comment, but it's critical to enforce.
    await requirePermission(session.user.id, validated.orgId, "roles:manage");
    
    const standardRoles = await tx.query.roles.findMany({
      where: (roles, { inArray }) => inArray(roles.slug, ["admin", "member", "viewer"])
    });

    const { 
      DEFAULT_ADMIN_PERMISSIONS, 
      DEFAULT_MEMBER_PERMISSIONS, 
      DEFAULT_VIEWER_PERMISSIONS 
    } = await import("@/lib/auth/permissions");

    const syncResults = [];

    for (const role of standardRoles) {
      let targetPermissions: PermissionKey[] = [];
      if (role.slug === "admin") targetPermissions = DEFAULT_ADMIN_PERMISSIONS;
      else if (role.slug === "member") targetPermissions = DEFAULT_MEMBER_PERMISSIONS;
      else if (role.slug === "viewer") targetPermissions = DEFAULT_VIEWER_PERMISSIONS;

      if (targetPermissions.length === 0) continue;

      // 1. Delete existing permissions for this standard role
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));

      // 2. Insert correct permissions
      const permsToInsert = targetPermissions.map(p => ({
        roleId: role.id,
        permissionKey: p,
      }));

      await tx.insert(rolePermissions).values(permsToInsert);
      syncResults.push({ role: role.slug, count: permsToInsert.length });
    }

    // Record Audit Log
    await recordAuditLog({
      organizationId: orgId,
      action: "PERMISSIONS_SYNCED",
      entityType: "ROLE",
      entityId: orgId,
      details: `Synchronized permissions for standard roles: ${syncResults.map(r => r.role).join(", ")}`
    });

    return { success: true, results: syncResults };
  });
}

