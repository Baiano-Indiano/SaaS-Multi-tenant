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
import { requirePermission } from "@/lib/auth/rbac-utils";
import { logger } from "@/lib/logger";

import { sendNotification } from "@/lib/notifications";
import { recordAuditLog } from "@/lib/audit";
import { emitEvent } from "@/lib/events";
import { createProjectSchema, deleteProjectSchema, updateProjectSchema } from "@/lib/validations";

export async function createProjectAction(data: {
  name: string;
  description?: string;
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    logger.warn('action', 'createProjectAction aborted: Unauthenticated access attempt');
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  logger.info('action', `createProjectAction called by User ${session.user.id} in Org ${data.orgId} for project: "${data.name}"`);

  try {
    // Input Validation
    const validated = createProjectSchema.parse(data);

    // RBAC: Verify user has permission to create projects
    await requirePermission(session.user.id, validated.orgId, "projects:create");

    // 1. Check Quota
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, data.orgId),
    });

    if (!org) {
      logger.warn('action', `createProjectAction failed: Org ${data.orgId} not found`);
      return { success: false, error: "Organização não encontrada." };
    }
    const currentPlan = Reflect.get(PLANS, org.plan.toUpperCase()) || PLANS.FREE;

    const result = await getTenantDb(session.user.id, data.orgId, async (tenantDb) => {
      // Direct count in tenant schema
      const currentCount = await tenantDb.select({ val: count() }).from(projects);
      
      if (currentCount[0].val >= currentPlan.maxProjects) {
        logger.warn('action', `createProjectAction aborted: Org ${data.orgId} projects quota exceeded (${currentCount[0].val}/${currentPlan.maxProjects})`);
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
      return { success: false, error: "Limite de projetos atingido para o seu plano." };
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
    await emitEvent(data.orgId, "project.created", {
      ...result.project,
      actorName: session.user.name || session.user.email,
    });

    logger.info('action', `createProjectAction completed successfully. Project ID: ${result.project.id}`);
    return result;
  } catch (error) {
    logger.error("action", `createProjectAction failed for Org ${data.orgId}`, error);
    return { success: false, error: error instanceof Error ? error.message : "Falha ao criar projeto." };
  }
}

/**
 * getProjectsAction
 */
export async function getProjectsAction(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    logger.warn('action', `getProjectsAction aborted: Unauthenticated fetch for Org ${orgId}`);
    return []; // Return empty list for unauthenticated
  }

  logger.info('action', `getProjectsAction called by User ${session.user.id} for Org ${orgId}`);

  try {
    // RBAC: Verify user has permission to read projects
    await requirePermission(session.user.id, orgId, "projects:read");

    const result = await getTenantDb(session.user.id, orgId, async (db) => {
      return await db.select().from(projects).orderBy(projects.createdAt);
    }, { mode: 'reader' });

    logger.info('action', `getProjectsAction returned ${result.length} projects for Org ${orgId}`);
    return result;
  } catch (error) {
    logger.error("action", `getProjectsAction failed for Org ${orgId}`, error);
    return [];
  }
}

/**
 * deleteProjectAction
 */
export async function deleteProjectAction(projectId: string, orgId: string, orgSlug: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    logger.warn('action', 'deleteProjectAction aborted: Unauthenticated request');
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  logger.info('action', `deleteProjectAction called by User ${session.user.id} for Project ${projectId} in Org ${orgId}`);

  try {
    // Input Validation
    const validated = deleteProjectSchema.parse({ projectId, orgId, orgSlug });

    // RBAC: Verify user has permission to delete projects
    await requirePermission(session.user.id, validated.orgId, "projects:delete");

    const projectToDelete = await getTenantDb(session.user.id, orgId, async (db) => {
      const p = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
      await db.delete(projects).where(eq(projects.id, projectId));
      return p[0];
    });

    revalidatePath(`/org/${orgSlug}/projects`);

    // Record Audit Log (Phase 11)
    await recordAuditLog({
      organizationId: orgId,
      action: "PROJECT_DELETED",
      entityType: "PROJECT",
      entityId: projectId,
      details: `Deleted project "${projectToDelete?.name || projectId}"`
    });

    // Trigger Automations (Phase 16)
    await emitEvent(orgId, "project.deleted", { 
      id: projectId,
      name: projectToDelete?.name,
      actorName: session.user.name || session.user.email,
    });

    logger.info('action', `deleteProjectAction completed successfully for Project ${projectId}`);
    return { success: true };
  } catch (error) {
    logger.error("action", `deleteProjectAction failed for Project ${projectId}`, error);
    return { success: false, error: error instanceof Error ? error.message : "Falha ao excluir projeto." };
  }
}

/**
 * getProjectAction
 */
export async function getProjectAction(orgId: string, projectId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    logger.warn('action', `getProjectAction aborted: Unauthenticated fetch for Project ${projectId}`);
    return null;
  }

  logger.info('action', `getProjectAction called by User ${session.user.id} for Project ${projectId} in Org ${orgId}`);

  try {
    // RBAC: Verify user has permission to read projects
    await requirePermission(session.user.id, orgId, "projects:read");

    const project = await getTenantDb(session.user.id, orgId, async (db) => {
      const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
      return result[0] || null;
    }, { mode: 'reader' });

    logger.info('action', `getProjectAction completed. Found: ${!!project}`);
    return project;
  } catch (error) {
    logger.error("action", `getProjectAction failed for Project ${projectId}`, error);
    return null;
  }
}

/**
 * updateProjectAction
 */
export async function updateProjectAction(
  orgId: string,
  projectId: string,
  orgSlug: string,
  data: {
    name?: string;
    description?: string;
    status?: string;
  }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    logger.warn('action', `updateProjectAction aborted: Unauthenticated update request for Project ${projectId}`);
    return { success: false, error: "Sessão expirada." };
  }

  logger.info('action', `updateProjectAction called by User ${session.user.id} for Project ${projectId} in Org ${orgId}`);

  try {
    // Input Validation
    updateProjectSchema.parse({ orgId, projectId, orgSlug, data });

    // RBAC: Verify user has permission to edit projects
    await requirePermission(session.user.id, orgId, "projects:update");

    const updatedProject = await getTenantDb(session.user.id, orgId, async (db) => {
      const result = await db.update(projects)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId))
        .returning();
      
      return result[0];
    });

    if (!updatedProject) {
      logger.warn('action', `updateProjectAction failed: Project ${projectId} not found for update`);
      return { success: false, error: "Projeto não encontrado." };
    }

    revalidatePath(`/org/${orgSlug}/projects`);
    revalidatePath(`/org/${orgSlug}/projects/${projectId}`);
    revalidatePath(`/org/${orgSlug}/projects/${projectId}/settings`);

    // Record Audit Log
    await recordAuditLog({
      organizationId: orgId,
      action: "PROJECT_UPDATED",
      entityType: "PROJECT",
      entityId: projectId,
      details: `Updated project fields: ${Object.keys(data).join(", ")}`
    });

    // Trigger Automations
    await emitEvent(orgId, "project.updated", { 
      ...updatedProject,
      actorName: session.user.name || session.user.email,
    });

    logger.info('action', `updateProjectAction completed successfully for Project ${projectId}`);
    return { success: true, project: updatedProject };
  } catch (error) {
    logger.error("action", `updateProjectAction failed for Project ${projectId}`, error);
    return { success: false, error: error instanceof Error ? error.message : "Falha ao atualizar projeto." };
  }
}
