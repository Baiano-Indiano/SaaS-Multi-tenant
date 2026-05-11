"use server";

import { db } from "@/lib/db";
import { statusComponents, statusIncidents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";
import { requirePermission } from "@/lib/auth/rbac-utils";

// --- SCHEMAS ---

export const UpsertComponentSchema = z.object({
  organizationId: z.string(),
  id: z.string().optional(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  status: z.enum(["operational", "degraded", "partial_outage", "major_outage"]),
  isActive: z.boolean().default(true),
});

export const DeleteComponentSchema = z.object({
  organizationId: z.string(),
  id: z.string(),
});

export const CreateIncidentSchema = z.object({
  organizationId: z.string(),
  title: z.string().min(5, "Título deve ter pelo menos 5 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  status: z.enum(["investigating", "identified", "monitoring", "resolved"]),
  severity: z.enum(["minor", "major", "critical"]),
});

export const UpdateIncidentSchema = z.object({
  organizationId: z.string(),
  id: z.string(),
  status: z.enum(["investigating", "identified", "monitoring", "resolved"]),
  description: z.string().optional(),
});

// --- ACTIONS ---

export const upsertStatusComponentAction = async (inputData: z.infer<typeof UpsertComponentSchema>) => {
  const data = UpsertComponentSchema.parse(inputData);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.session.activeOrganizationId !== data.organizationId) {
    throw new Error("Não autorizado");
  }

  await requirePermission(session.user.id, data.organizationId, "org:update");

  const { id, organizationId, ...rest } = data;

  if (id) {
    await db.update(statusComponents)
      .set({ ...rest, updatedAt: new Date() })
      .where(and(eq(statusComponents.id, id), eq(statusComponents.organizationId, organizationId)));
  } else {
    await db.insert(statusComponents).values({
      id: createId(),
      organizationId,
      ...rest,
    });
  }

  revalidatePath(`/org/${organizationId}/settings/status`);
  revalidatePath(`/status/${organizationId}`); // Future proofing
};

export const deleteStatusComponentAction = async (inputData: z.infer<typeof DeleteComponentSchema>) => {
  const data = DeleteComponentSchema.parse(inputData);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.session.activeOrganizationId !== data.organizationId) {
    throw new Error("Não autorizado");
  }

  await requirePermission(session.user.id, data.organizationId, "org:update");

  await db.delete(statusComponents)
    .where(and(eq(statusComponents.id, data.id), eq(statusComponents.organizationId, data.organizationId)));

  revalidatePath(`/org/${data.organizationId}/settings/status`);
};

export const createStatusIncidentAction = async (inputData: z.infer<typeof CreateIncidentSchema>) => {
  const data = CreateIncidentSchema.parse(inputData);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.session.activeOrganizationId !== data.organizationId) {
    throw new Error("Não autorizado");
  }

  await requirePermission(session.user.id, data.organizationId, "org:update");

  await db.insert(statusIncidents).values({
    id: createId(),
    organizationId: data.organizationId,
    title: data.title,
    description: data.description,
    status: data.status,
    severity: data.severity,
  });

  revalidatePath(`/org/${data.organizationId}/settings/status`);
};

export const updateStatusIncidentAction = async (inputData: z.infer<typeof UpdateIncidentSchema>) => {
  const data = UpdateIncidentSchema.parse(inputData);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.session.activeOrganizationId !== data.organizationId) {
    throw new Error("Não autorizado");
  }

  await requirePermission(session.user.id, data.organizationId, "org:update");

  const { id, organizationId, ...rest } = data;

  await db.update(statusIncidents)
    .set({ 
      ...rest, 
      updatedAt: new Date(),
      resolvedAt: rest.status === "resolved" ? new Date() : null
    })
    .where(and(eq(statusIncidents.id, id), eq(statusIncidents.organizationId, organizationId)));

  revalidatePath(`/org/${organizationId}/settings/status`);
};

export const DeleteIncidentSchema = z.object({
  organizationId: z.string(),
  id: z.string(),
});

export const deleteStatusIncidentAction = async (inputData: z.infer<typeof DeleteIncidentSchema>) => {
  const data = DeleteIncidentSchema.parse(inputData);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.session.activeOrganizationId !== data.organizationId) {
    throw new Error("Não autorizado");
  }

  await requirePermission(session.user.id, data.organizationId, "org:update");

  await db.delete(statusIncidents)
    .where(and(eq(statusIncidents.id, data.id), eq(statusIncidents.organizationId, data.organizationId)));

  revalidatePath(`/org/${data.organizationId}/settings/status`);
};


