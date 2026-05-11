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

import { sendNotification } from "@/lib/notifications";
import { recordAuditLog } from "@/lib/audit";
import { emitEvent } from "@/lib/events";
import { createProjectSchema, deleteProjectSchema, updateProjectSchema, uuidSchema } from "@/lib/validations";

export async function createProjectAction(data: {
  name: string;
  description?: string;
  orgId: string;
  orgSlug: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { success: false, error: "Sessão expirada. Faça login novamente." };

  try {
    // Input Validation
    const validated = createProjectSchema.parse(data);

    // RBAC: Verify user has permission to create projects
    await requirePermission(session.user.id, validated.orgId, "projects:create");

    // 1. Check Quota
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, data.orgId),
    });

    if (!org) return { success: false, error: "Organização não encontrada." };
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

    return result;
  } catch (error) {
    console.error("Failed to create project:", error);
    return { success: false, error: error instanceof Error ? error.message : "Falha ao criar projeto." };
  }
}

/**
 * getProjectsAction
 */
export async function getProjectsAction(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return []; // Return empty list for unauthenticated

  try {
    // RBAC: Verify user has permission to read projects
    await requirePermission(session.user.id, orgId, "projects:read");

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
  if (!session?.user) return { success: false, error: "Sessão expirada. Faça login novamente." };

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

    return { success: true };
  } catch (error) {
    console.error("Failed to delete project:", error);
    return { success: false, error: error instanceof Error ? error.message : "Falha ao excluir projeto." };
  }
}

/**
 * getProjectAction
 */
export async function getProjectAction(orgId: string, projectId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  try {
    // RBAC: Verify user has permission to read projects
    await requirePermission(session.user.id, orgId, "projects:read");

    return await getTenantDb(session.user.id, orgId, async (db) => {
      const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
      return result[0] || null;
    });
  } catch (error) {
    console.error("Failed to fetch project:", error);
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
  if (!session?.user) return { success: false, error: "Sessão expirada." };

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

    if (!updatedProject) return { success: false, error: "Projeto não encontrado." };

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

    return { success: true, project: updatedProject };
  } catch (error) {
    console.error("Failed to update project:", error);
    return { success: false, error: error instanceof Error ? error.message : "Falha ao atualizar projeto." };
  }
}
