"use server";

import { db } from "@/lib/db";
import { statusComponents, statusIncidents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";

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

export const upsertStatusComponentAction = async (data: z.infer<typeof UpsertComponentSchema>) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Não autorizado");

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

export const deleteStatusComponentAction = async (data: z.infer<typeof DeleteComponentSchema>) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Não autorizado");

  await db.delete(statusComponents)
    .where(and(eq(statusComponents.id, data.id), eq(statusComponents.organizationId, data.organizationId)));

  revalidatePath(`/org/${data.organizationId}/settings/status`);
};

export const createStatusIncidentAction = async (data: z.infer<typeof CreateIncidentSchema>) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Não autorizado");

  await db.insert(statusIncidents).values({
    id: createId(),
    ...data,
  });

  revalidatePath(`/org/${data.organizationId}/settings/status`);
};


