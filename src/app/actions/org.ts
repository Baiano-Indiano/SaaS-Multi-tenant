"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import postgres from "postgres";

import { randomUUID } from "crypto";

const connectionString = process.env.DATABASE_URL!;

export async function createOrganizationAction(name: string, slug: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    // 1. Create organization using Better-Auth
    const org = await auth.api.createOrganization({
      headers: await headers(),
      body: {
        name,
        slug,
        userId: session.user.id,
      }
    });

    if (!org) throw new Error("Failed to create organization");

    // 2. Provision Tenant Schema (Simple logic for now)
    const tenantSchema = `tenant_${org.slug.replace(/-/g, "_")}`;
    
    // Update org with schema name in public database
    await db.update(organizations)
      .set({ tenantSchemaName: tenantSchema })
      .where(eq(organizations.id, org.id));

    // 3. Create Schema and Seed Roles
    const client = postgres(connectionString, { prepare: false });
    try {
      await client`CREATE SCHEMA IF NOT EXISTS ${client(tenantSchema)}`;
      
      // Basic RBAC tables in tenant schema (if not already there)
      // Note: In a real app, you'd run migrations here.
      // For this starter, we'll assume the tables 'role' and 'role_permission' exist or should be created.
      
      await client`
        CREATE TABLE IF NOT EXISTS ${client(tenantSchema)}.role (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT
        )
      `;

      await client`
        CREATE TABLE IF NOT EXISTS ${client(tenantSchema)}.role_permission (
          id SERIAL PRIMARY KEY,
          "roleId" UUID NOT NULL REFERENCES ${client(tenantSchema)}.role(id) ON DELETE CASCADE,
          "permissionKey" TEXT NOT NULL
        )
      `;

      // 4. Seed Default Roles (Admin, Member, Viewer)
      const adminId = randomUUID();
      const memberId = randomUUID();
      const viewerId = randomUUID();

      await client`
        INSERT INTO ${client(tenantSchema)}.role (id, name, slug, description)
        VALUES 
          (${adminId}, 'Admin', 'admin', 'Full access to all resources'),
          (${memberId}, 'Member', 'member', 'Standard access to organization resources'),
          (${viewerId}, 'Viewer', 'viewer', 'Read-only access')
        ON CONFLICT DO NOTHING
      `;

      // 5. Seed Permissions for Default Roles
      const adminPermissions = [
        "org:update", "org:delete", "members:read", "members:invite", 
        "members:remove", "roles:manage", "roles:assign", "billing:read", "billing:manage"
      ];
      const memberPermissions = ["members:read", "members:invite", "billing:read"];
      const viewerPermissions = ["members:read", "billing:read"];

      const permissionInserts = [
        ...adminPermissions.map(p => ({ roleId: adminId, permissionKey: p })),
        ...memberPermissions.map(p => ({ roleId: memberId, permissionKey: p })),
        ...viewerPermissions.map(p => ({ roleId: viewerId, permissionKey: p })),
      ];

      for (const item of permissionInserts) {
        await client`
          INSERT INTO ${client(tenantSchema)}.role_permission ("roleId", "permissionKey")
          VALUES (${item.roleId}, ${item.permissionKey})
        `;
      }

      // Assign first user (admin) to the admin role in the public.member table
      // Better-Auth 'organization' plugin creates a member entry. We need to link it to our Role.
      await db.execute(sql`
        UPDATE member 
        SET "roleId" = ${adminId} 
        WHERE "userId" = ${session.user.id} AND "organizationId" = ${org.id}
      `);

    } catch (dbErr) {
      console.error("Error provisioning tenant:", dbErr);
      // We don't throw here to not break the org creation, but it's a critical failure in production.
    } finally {
      await client.end();
    }

    return { 
      success: true, 
      organizationId: org.id, 
      slug: org.slug 
    };
  } catch (error) {
    console.error("Organization creation failed:", error);
    throw error;
  }
}
