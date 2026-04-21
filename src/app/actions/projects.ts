"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTenantDb } from "@/lib/db/tenant-db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
    const result = await getTenantDb(session.user.id, data.orgId, async (db) => {
      return await db.insert(projects).values({
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description,
        userId: session.user.id, // Logical reference (Rule 3)
      }).returning();
    });

    revalidatePath(`/org/${data.orgSlug}/projects`);
    return { success: true, project: result[0] };
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
    return { success: true };
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw error;
  }
}
