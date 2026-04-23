"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTenantDb } from "@/lib/db/tenant-db";
import { projects } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { PLANS } from "@/lib/billing/plans";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

import { sendNotification } from "@/lib/notifications";
import { recordAuditLog } from "@/lib/audit";
import { emitEvent } from "@/lib/events";

/**
 * createProjectAction
 * 
 * Demonstrates hardened isolation:
 * - Uses session validation.
 * - Uses getTenantDb to enforce search_path and membership (Rule 1).
 */
export async function createProjectAction(data: {
  name: string;
  description?: string;
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    // 1. Check Quota
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, data.orgId),
    });

    if (!org) throw new Error("Organization not found");
    const currentPlan = PLANS[org.plan.toUpperCase() as keyof typeof PLANS] || PLANS.FREE;

    const result = await getTenantDb(session.user.id, data.orgId, async (tenantDb) => {
      // Direct count in tenant schema
      const currentCount = await tenantDb.select({ val: count() }).from(projects);
      
      if (currentCount[0].val >= currentPlan.maxProjects) {
        return { error: "QUOTA_EXCEEDED" };
      }

      const newProject = await tenantDb.insert(projects).values({
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description,
        userId: session.user.id,
      }).returning();

      return { success: true, project: newProject[0] };
    });

    if ("error" in result) {
      return result;
    }

    // Real-time notification (Collaborative fan-out)
    await sendNotification({
      userId: session.user.id,
      organizationId: data.orgId,
      type: "PROJECT_CREATED",
      title: "New Project Created",
      message: `${session.user.name || session.user.email} created the project "${data.name}".`,
      link: `/org/${data.orgSlug}/projects`
    });

    revalidatePath(`/org/${data.orgSlug}/projects`);

    // Record Audit Log (Phase 11)
    await recordAuditLog({
      organizationId: data.orgId,
      action: "PROJECT_CREATED",
      entityType: "PROJECT",
      entityId: result.project.id,
      details: `Created project "${data.name}"`
    });

    // Trigger Automations (Phase 16)
    await emitEvent(data.orgId, "project.created", result.project);

    return result;
  } catch (error) {
    console.error("Failed to create project:", error);
    throw error;
  }
}

/**
 * getProjectsAction
 */
export async function getProjectsAction(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    return await getTenantDb(session.user.id, orgId, async (db) => {
      return await db.select().from(projects).orderBy(projects.createdAt);
    });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return [];
  }
}

/**
 * deleteProjectAction
 */
export async function deleteProjectAction(projectId: string, orgId: string, orgSlug: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    await getTenantDb(session.user.id, orgId, async (db) => {
      await db.delete(projects).where(eq(projects.id, projectId));
    });

    revalidatePath(`/org/${orgSlug}/projects`);

    // Record Audit Log (Phase 11)
    await recordAuditLog({
      organizationId: orgId,
      action: "PROJECT_DELETED",
      entityType: "PROJECT",
      entityId: projectId,
      details: `Deleted project (ID: ${projectId})`
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw error;
  }
}
