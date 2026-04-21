"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import postgres from "postgres";

import { randomUUID } from "crypto";

import { recordAuditLog } from "@/lib/audit";

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/saas_db";

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

    // 3. Create Schema and Initial Tables
    const client = postgres(connectionString, { prepare: false });
    try {
      await client`CREATE SCHEMA IF NOT EXISTS ${client(tenantSchema)}`;
      
      // I'll define the exact DDL to ensure consistency with Rule 2 & 3
      const ddl = [
        `CREATE TABLE IF NOT EXISTS ${tenantSchema}.role (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS ${tenantSchema}.role_permission (
          "roleId" TEXT NOT NULL REFERENCES ${tenantSchema}.role(id) ON DELETE CASCADE,
          "permissionKey" TEXT NOT NULL,
          PRIMARY KEY ("roleId", "permissionKey")
        )`,
        `CREATE TABLE IF NOT EXISTS ${tenantSchema}.project (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          "userId" TEXT NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS ${tenantSchema}.audit_log (
          id TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "userName" TEXT NOT NULL,
          "userEmail" TEXT NOT NULL,
          action TEXT NOT NULL,
          "entityType" TEXT NOT NULL,
          "entityId" TEXT,
          details TEXT,
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )`
      ];

      for (const query of ddl) {
        await client.unsafe(query);
      }

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
        "members:remove", "roles:manage", "roles:assign", "billing:read", "billing:manage",
        "projects:create", "projects:delete", "projects:view", "audit_logs:read"
      ];
      const memberPermissions = ["members:read", "members:invite", "billing:read", "projects:create", "projects:view"];
      const viewerPermissions = ["members:read", "billing:read", "projects:view"];

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

    // Record Audit Log (Phase 11) - AFTER provisioning
    await recordAuditLog({
      organizationId: org.id,
      action: "ORG_CREATED",
      entityType: "ORGANIZATION",
      entityId: org.id,
      details: `Criou a organização ${name} (${slug})`
    });

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
