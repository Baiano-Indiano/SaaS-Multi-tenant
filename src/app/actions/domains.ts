"use server";

import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { addDomainToProject, removeDomainFromProject, getDomainConfig } from "@/lib/vercel";
import { Redis } from "@upstash/redis";
import { revalidatePath } from "next/cache";
import { PLANS, PlanType } from "@/lib/billing/plans";
import { recordAuditLog } from "@/lib/audit";
import { can } from "@/lib/auth/rbac-utils";
import { 
  addCustomDomainSchema, 
  removeCustomDomainSchema, 
  checkDomainStatusSchema 
} from "@/lib/validations";
import { enforceRateLimit, domainActionRateLimit } from "@/lib/rate-limit";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function addDomainAction(orgId: string, domain: string) {
  const validated = addCustomDomainSchema.parse({ orgId, domain });

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Não autorizado");

  // RBAC: Verify permission to manage org settings
  const allowed = await can(session.user.id, validated.orgId, "org:update");
  if (!allowed) {
    return { error: "Você não tem permissão para gerenciar domínios." };
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, validated.orgId));

  if (!org) throw new Error("Organização não encontrada");

  // Check plan (DOM-01)
  const plan = PLANS[org.plan.toUpperCase() as PlanType];
  if (!plan?.customDomains) {
    return { error: "Seu plano atual não suporta domínios customizados. Faça o upgrade para o plano Pro." };
  }

  // 1. Add to Vercel
  const vercelResult = await addDomainToProject(validated.domain);
  if (vercelResult.error) {
    return { error: vercelResult.error };
  }

  // 2. Update DB
  await db
    .update(organizations)
    .set({
      customDomain: validated.domain,
      domainVerified: false,
    })
    .where(eq(organizations.id, validated.orgId));

  // 3. Sync to Redis for Middleware (DOM-03)
  await redis.set(`domain:${validated.domain}`, { slug: org.slug, id: org.id });

  revalidatePath(`/org/${org.slug}/settings/domains`);

  // Record Audit Log (Phase 11)
  await recordAuditLog({
    organizationId: validated.orgId,
    action: "DOMAIN_ADDED",
    entityType: "DOMAIN",
    details: `Added custom domain: ${validated.domain}`
  });

  return { success: true };
}

export async function removeDomainAction(orgId: string) {
  const validated = removeCustomDomainSchema.parse({ orgId });

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Não autorizado");

  // RBAC: Verify permission to manage org settings
  const allowed = await can(session.user.id, validated.orgId, "org:update");
  if (!allowed) {
    return { error: "Você não tem permissão para gerenciar domínios." };
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, validated.orgId));

  if (!org || !org.customDomain) return { success: true };

  const domainToRemove = org.customDomain;

  // 1. Remove from Vercel
  await removeDomainFromProject(domainToRemove);

  // 2. Update DB
  await db
    .update(organizations)
    .set({
      customDomain: null,
      domainVerified: false,
    })
    .where(eq(organizations.id, validated.orgId));

  // 3. Remove from Redis
  await redis.del(`domain:${domainToRemove}`);

  revalidatePath(`/org/${org.slug}/settings/domains`);

  // Record Audit Log (Phase 11)
  await recordAuditLog({
    organizationId: validated.orgId,
    action: "DOMAIN_REMOVED",
    entityType: "DOMAIN",
    details: `Removed custom domain: ${domainToRemove}`
  });

  return { success: true };
}

export async function checkDomainStatusAction(orgId: string) {
  const validated = checkDomainStatusSchema.parse({ orgId });

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.session.activeOrganizationId !== validated.orgId) {
    throw new Error("Unauthorized");
  }

  await enforceRateLimit(domainActionRateLimit, session.user.id);

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, validated.orgId));

  if (!org || !org.customDomain) return null;

  // Real-time ping to Vercel (DOM-02)
  const status = await getDomainConfig(org.customDomain);

  if (status.isValid && !org.domainVerified) {
    await db
      .update(organizations)
      .set({ domainVerified: true })
      .where(eq(organizations.id, validated.orgId));
    
    await recordAuditLog({
      organizationId: validated.orgId,
      action: "DOMAIN_VERIFIED",
      entityType: "DOMAIN",
      details: `Custom domain ${org.customDomain} verified successfully.`
    });

    revalidatePath(`/org/${org.slug}/settings/domains`);
  }

  return status;
}
