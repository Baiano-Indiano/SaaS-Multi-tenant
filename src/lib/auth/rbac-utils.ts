import { db } from "../db";
import { members, rolePermissions } from "../db/schema";
import { PermissionKey } from "./permissions";
import { eq, and } from "drizzle-orm";
import { withAdminTenantDb } from "../db/tenant-db";

export interface TenantRole {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
}

export interface TenantRoleWithPermissions extends TenantRole {
  permissions: PermissionKey[];
}

/**
 * Server-side permission check. 
 */
export async function can(userId: string, organizationId: string, permission: PermissionKey): Promise<boolean> {
  const member = await db.query.members.findFirst({
    where: and(
      eq(members.userId, userId),
      eq(members.organizationId, organizationId)
    ),
    with: {
      organization: true
    }
  });

  if (!member || !member.roleId || !member.organization.tenantSchemaName) {
    return false;
  }

  // Use withAdminTenantDb to execute check in the correct schema context
  return await withAdminTenantDb(organizationId, async (tx) => {
    const result = await tx.query.rolePermissions.findFirst({
      where: and(
        eq(rolePermissions.roleId, member.roleId!),
        eq(rolePermissions.permissionKey, permission)
      )
    });
    
    return !!result;
  }, { mode: 'reader' });
}

/**
 * Higher-order helper for Server Actions to enforce permissions.
 */
export async function requirePermission(userId: string, organizationId: string, permission: PermissionKey) {
  const allowed = await can(userId, organizationId, permission);
  if (!allowed) {
    throw new Error("Forbidden: Missing required permission: " + permission);
  }
}

/**
 * Fetch all roles for a given organization.
 */
export async function getRoles(organizationId: string): Promise<TenantRole[]> {
  return await withAdminTenantDb(organizationId, async (tx) => {
    const rows = await tx.query.roles.findMany({
      orderBy: (roles, { asc }) => [asc(roles.name)],
    });
    return rows as TenantRole[];
  }, { mode: 'reader' });
}

/**
 * Fetch all roles with their assigned permissions for a given organization.
 */
export async function getRolesWithPermissions(organizationId: string): Promise<TenantRoleWithPermissions[]> {
  return await withAdminTenantDb(organizationId, async (tx) => {
    // 1. Fetch all roles
    const rolesRows = await tx.query.roles.findMany({
      orderBy: (roles, { asc }) => [asc(roles.name)],
    });

    if (rolesRows.length === 0) return [];

    // 2. Fetch all permissions for these roles in a single query
    const permsRows = await tx.query.rolePermissions.findMany();

    // 3. Map permissions to roles
    return rolesRows.map(role => ({
      ...(role as TenantRole),
      permissions: permsRows
        .filter(p => p.roleId === role.id)
        .map(p => p.permissionKey) as PermissionKey[]
    }));
  }, { mode: 'reader' });
}

// Re-exported from shared constants for server-side convenience
export { PERMISSIONS_METADATA_KEY } from "./rbac-constants";
