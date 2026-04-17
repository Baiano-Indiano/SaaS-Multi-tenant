"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { can } from "@/lib/auth/rbac-utils";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { randomUUID } from "crypto";
import { PermissionKey } from "@/lib/auth/permissions";

const connectionString = process.env.DATABASE_URL!;

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

  // Security: Check if user has permission to manage roles
  const allowed = await can(session.user.id, formData.orgId, "roles:manage");
  if (!allowed) throw new Error("Forbidden: Missing roles:manage permission");

  // Get tenant schema
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, formData.orgId),
  });
  if (!org?.tenantSchemaName) throw new Error("Organization schema not found");

  const schema = org.tenantSchemaName;
  const client = postgres(connectionString, { prepare: false });

  try {
    await client.begin(async (sql) => {
      const roleId = randomUUID();

      // 1. Insert role
      await sql`
        INSERT INTO ${sql(schema)}.role (id, name, slug, description)
        VALUES (${roleId}, ${formData.name}, ${formData.slug}, ${formData.description})
      `;

      // 2. Insert permissions
      if (formData.permissions.length > 0) {
        for (const p of formData.permissions) {
          await sql`
            INSERT INTO ${sql(schema)}.role_permission ("roleId", "permissionKey")
            VALUES (${roleId}, ${p})
          `;
        }
      }
    });

    revalidatePath(`/org/${formData.orgSlug}/settings/roles`);
    return { success: true };
  } catch (error) {
    console.error("Failed to create role:", error);
    throw new Error("Failed to create role");
  } finally {
    await client.end();
  }
}

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

  const allowed = await can(session.user.id, formData.orgId, "roles:manage");
  if (!allowed) throw new Error("Forbidden");

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, formData.orgId),
  });
  if (!org?.tenantSchemaName) throw new Error("Schema not found");

  const schema = org.tenantSchemaName;
  const client = postgres(connectionString, { prepare: false });

  try {
    await client.begin(async (sql) => {
      // Security check: System roles are immutable
      const role = await sql`SELECT slug FROM ${sql(schema)}.role WHERE id = ${formData.id}`.then(res => res[0]);
      if (role && ['admin', 'member', 'viewer'].includes(role.slug)) {
        throw new Error("System roles are immutable and cannot be edited");
      }

      // 1. Update role details
      await sql`
        UPDATE ${sql(schema)}.role 
        SET name = ${formData.name}, description = ${formData.description}
        WHERE id = ${formData.id}
      `;

      // 2. Sync permissions (simple way: delete and re-insert)
      await sql`
        DELETE FROM ${sql(schema)}.role_permission 
        WHERE "roleId" = ${formData.id}
      `;

      if (formData.permissions.length > 0) {
        for (const p of formData.permissions) {
          await sql`
            INSERT INTO ${sql(schema)}.role_permission ("roleId", "permissionKey")
            VALUES (${formData.id}, ${p})
          `;
        }
      }
    });

    revalidatePath(`/org/${formData.orgSlug}/settings/roles`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update role:", error);
    throw new Error("Failed to update role");
  } finally {
    await client.end();
  }
}

export async function deleteRoleAction(roleId: string, orgId: string, orgSlug: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const allowed = await can(session.user.id, orgId, "roles:manage");
  if (!allowed) throw new Error("Forbidden");

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  });
  if (!org?.tenantSchemaName) throw new Error("Schema not found");

  const schema = org.tenantSchemaName;
  const client = postgres(connectionString, { prepare: false });

  try {
    const role = await client`SELECT slug FROM ${client(schema)}.role WHERE id = ${roleId}`.then(res => res[0]);
    if (role && ['admin', 'member', 'viewer'].includes(role.slug)) {
      throw new Error("System roles are immutable and cannot be deleted");
    }

    await client`
      DELETE FROM ${client(schema)}.role 
      WHERE id = ${roleId}
    `;

    revalidatePath(`/org/${orgSlug}/settings/roles`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete role:", error);
    throw new Error("Failed to delete role");
  } finally {
    await client.end();
  }
}
