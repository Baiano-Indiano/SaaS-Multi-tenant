"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { can } from "@/lib/auth/rbac-utils";
import postgres from "postgres";

import { randomUUID } from "crypto";

import { recordAuditLog } from "@/lib/audit";
import { createOrgSchema, updateOrgSchema } from "@/lib/validations";
import { orgCreateRateLimit, enforceRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { redis } from "@/lib/redis";
import { l1Cache } from "@/lib/cache/l1-cache";

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/saas_db";

type CreateOrganizationResult =
  | { success: true; organizationId: string; slug: string }
  | { success: false; error: string };

type UpdateOrganizationResult =
  | { success: true }
  | { success: false; error: string };

export async function createOrganizationAction(name: string, slug: string): Promise<CreateOrganizationResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    logger.warn('action', 'createOrganizationAction aborted: Unauthenticated access attempt');
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  logger.info('action', `createOrganizationAction called by User ${session.user.id} for Org Name: "${name}", Slug: "${slug}"`);

  try {
    // Input Validation
    const validated = createOrgSchema.parse({ name, slug });
    name = validated.name;
    slug = validated.slug;

    // Rate Limiting: 3 orgs per hour per user
    await enforceRateLimit(orgCreateRateLimit, session.user.id);
    // 1. Create organization using Better-Auth
    const org = await auth.api.createOrganization({
      headers: await headers(),
      body: {
        name,
        slug,
        userId: session.user.id,
      }
    });
    if (!org) {
      logger.warn('action', `createOrganizationAction failed: better-auth could not create organization`);
      throw new Error("Failed to create organization");
    }

    // 2. Provision Tenant Schema (Simple logic for now)
    const tenantSchema = `tenant_${org.slug.replace(/-/g, "_")}`.toLowerCase();
    
    // Security: Validate schema name to prevent SQL injection in DDL
    const SAFE_SCHEMA_REGEX = /^tenant_[a-zA-Z0-9_]+$/;
    if (!SAFE_SCHEMA_REGEX.test(tenantSchema)) {
      logger.warn('action', `createOrganizationAction aborted: Invalid tenant schema name "${tenantSchema}" derived from slug`);
      throw new Error("Invalid tenant schema name derived from slug. Aborting provisioning.");
    }

    // Update org with schema name in public database
    await db.update(organizations)
      .set({ tenantSchemaName: tenantSchema })
      .where(eq(organizations.id, org.id));

    // 3. Create Schema and Initial Tables
    const client = postgres(connectionString, { prepare: false });
    try {
      logger.info('db', `Provisioning schema "${tenantSchema}" for organization "${org.id}"`);
      await client`CREATE SCHEMA IF NOT EXISTS ${client(tenantSchema)}`;
      
      // I'll define the exact DDL to ensure consistency with Rule 2 & 3
      const ddl = [
        `CREATE TABLE IF NOT EXISTS "${tenantSchema}".role (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS "${tenantSchema}".role_permission (
          "roleId" TEXT NOT NULL REFERENCES "${tenantSchema}".role(id) ON DELETE CASCADE,
          "permissionKey" TEXT NOT NULL,
          PRIMARY KEY ("roleId", "permissionKey")
        )`,
        `CREATE TABLE IF NOT EXISTS "${tenantSchema}".project (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          "userId" TEXT NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS "${tenantSchema}".audit_log (
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

      // 5. Seed Permissions for Default Roles (Using constants from permissions.ts)
      const { 
        DEFAULT_ADMIN_PERMISSIONS, 
        DEFAULT_MEMBER_PERMISSIONS, 
        DEFAULT_VIEWER_PERMISSIONS 
      } = await import("@/lib/auth/permissions");

      const permissionInserts = [
        ...DEFAULT_ADMIN_PERMISSIONS.map(p => ({ roleId: adminId, permissionKey: p })),
        ...DEFAULT_MEMBER_PERMISSIONS.map(p => ({ roleId: memberId, permissionKey: p })),
        ...DEFAULT_VIEWER_PERMISSIONS.map(p => ({ roleId: viewerId, permissionKey: p })),
      ];

      for (const item of permissionInserts) {
        await client`
          INSERT INTO ${client(tenantSchema)}.role_permission ("roleId", "permissionKey")
          VALUES (${item.roleId}, ${item.permissionKey})
          ON CONFLICT DO NOTHING
        `;
      }

      // Assign first user (admin) to the admin role in the public.member table
      await db.execute(sql`
        UPDATE member 
        SET "roleId" = ${adminId} 
        WHERE "userId" = ${session.user.id} AND "organizationId" = ${org.id}
      `);

      logger.info('db', `Successfully provisioned schema "${tenantSchema}" and seeded default roles & permissions`);

    } catch (dbErr) {
      logger.error('db', `Error provisioning tenant schema "${tenantSchema}"`, dbErr);
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
      details: `Created organization "${name}" (${slug})`
    });

    logger.info('action', `createOrganizationAction completed successfully. Org ID: ${org.id}`);

    // Write-through caching to Redis and L1 Cache for MFA policy checks
    const orgCacheData = { require2FA: false, id: org.id };
    await redis.set(`org:${org.id}`, orgCacheData);
    await redis.set(`org:${org.slug}`, orgCacheData);
    l1Cache.set(`org:${org.id}`, orgCacheData);
    l1Cache.set(`org:${org.slug}`, orgCacheData);

    return { 
      success: true, 
      organizationId: org.id, 
      slug: org.slug 
    };
  } catch (error) {
    logger.error('action', `createOrganizationAction failed for User ${session.user.id}`, error);
    const message = error instanceof Error ? error.message : "Falha ao criar organização.";
    return { success: false, error: message };
  }
}

export async function updateOrganizationAction(orgId: string, name: string, slug: string): Promise<UpdateOrganizationResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    logger.warn('action', 'updateOrganizationAction aborted: Unauthenticated access attempt');
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  logger.info('action', `updateOrganizationAction called by User ${session.user.id} for Org ID: "${orgId}" to Name: "${name}", Slug: "${slug}"`);

  try {
    // Input Validation
    const validated = updateOrgSchema.parse({ orgId, name, slug });
    orgId = validated.orgId;
    name = validated.name;
    slug = validated.slug;

    // 1. Verify Permission via RBAC
    const allowed = await can(session.user.id, orgId, "org:update");
    if (!allowed) {
      logger.warn('action', `updateOrganizationAction denied: User ${session.user.id} lacks 'org:update' on Org ${orgId}`);
      return { success: false, error: "Você não tem permissão para editar esta organização." };
    }

    // Fetch old organization details to get the old slug for cache invalidation
    const [oldOrg] = await db
      .select({ slug: organizations.slug, require2FA: organizations.require2FA })
      .from(organizations)
      .where(eq(organizations.id, orgId));

    // 2. Update organization
    await db.update(organizations)
      .set({ 
        name, 
        slug,
      })
      .where(eq(organizations.id, orgId));

    // Cache invalidation and write-through
    if (oldOrg) {
      if (oldOrg.slug !== slug) {
        await redis.del(`org:${oldOrg.slug}`);
        l1Cache.delete(`org:${oldOrg.slug}`);
      }
      const orgCacheData = { require2FA: oldOrg.require2FA, id: orgId };
      await redis.set(`org:${orgId}`, orgCacheData);
      await redis.set(`org:${slug}`, orgCacheData);
      l1Cache.set(`org:${orgId}`, orgCacheData);
      l1Cache.set(`org:${slug}`, orgCacheData);
    }

    // 3. Record Audit Log
    await recordAuditLog({
      organizationId: orgId,
      action: "ORG_UPDATED",
      entityType: "ORGANIZATION",
      entityId: orgId,
      details: `Updated organization name to "${name}" and slug to "${slug}"`
    });

    logger.info('action', `updateOrganizationAction completed successfully for Org ${orgId}`);
    return { success: true };
  } catch (error) {
    logger.error('action', `updateOrganizationAction failed for Org ${orgId}`, error);
    const message = error instanceof Error ? error.message : "Falha ao atualizar organização.";
    return { success: false, error: message };
  }
}
