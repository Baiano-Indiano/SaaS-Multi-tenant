import { db } from "../db";
import { members } from "../db/schema";
import { PermissionKey } from "./permissions";
import { eq, and } from "drizzle-orm";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

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

  const schema = member.organization.tenantSchemaName;
  const client = postgres(connectionString, { prepare: false, max: 1 });
  
  try {
    const result = await client`
      SELECT 1 
      FROM ${client(schema)}.role_permission 
      WHERE "roleId" = ${member.roleId} 
      AND "permissionKey" = ${permission}
      LIMIT 1
    `;
    
    return result.length > 0;
  } catch (error) {
    console.error(`Error checking permission ${permission} for user ${userId} in ${schema}:`, error);
    return false;
  } finally {
    await client.end();
  }
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
 * Fetch all roles for a given organization schema.
 */
export async function getRoles(schema: string): Promise<TenantRole[]> {
  const client = postgres(connectionString, { prepare: false, max: 1 });
  try {
    const rows = await client`
      SELECT id, name, slug, description, "createdAt"
      FROM ${client(schema)}.role
      ORDER BY name ASC
    `;
    return rows as unknown as TenantRole[];
  } finally {
    await client.end();
  }
}

/**
 * Fetch all roles with their assigned permissions.
 */
export async function getRolesWithPermissions(schema: string): Promise<TenantRoleWithPermissions[]> {
  const client = postgres(connectionString, { prepare: false, max: 1 });
  try {
    // 1. Fetch all roles
    const rolesRows = await client`
      SELECT id, name, slug, description, "createdAt"
      FROM ${client(schema)}.role
      ORDER BY name ASC
    `;

    if (rolesRows.length === 0) return [];

    // 2. Fetch all permissions for these roles
    const roleIds = rolesRows.map(r => r.id);
    const permissionsRows = await client`
      SELECT "roleId", "permissionKey"
      FROM ${client(schema)}.role_permission
      WHERE "roleId" IN ${client(roleIds)}
    `;

    // 3. Map permissions to roles
    return rolesRows.map(role => ({
      ...(role as unknown as TenantRole),
      permissions: permissionsRows
        .filter(p => p.roleId === role.id)
        .map(p => p.permissionKey) as PermissionKey[]
    }));
  } finally {
    await client.end();
  }
}

// Re-exported from shared constants for server-side convenience
export { PERMISSIONS_METADATA_KEY } from "./rbac-constants";
