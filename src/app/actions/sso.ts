"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organizationDomains, ssoConfigs, organizations, ssoProviders } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { verifyDomainTXT, normalizeDomain } from "@/lib/sso/dns";
import { revalidatePath } from "next/cache";
import { recordAuditLog } from "@/lib/audit";
import { 
  addDomainSchema, 
  verifyDomainSchema, 
  deleteDomainSchema, 
  updateSSOConfigSchema,
  emailSchema
} from "@/lib/validations";
import { enforceRateLimit, domainActionRateLimit, ssoActionRateLimit } from "@/lib/rate-limit";

export async function addDomainAction(orgId: string, domainRaw: string) {
  const validated = addDomainSchema.parse({ orgId, domainRaw });

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.session.activeOrganizationId !== validated.orgId) {
    throw new Error("Unauthorized");
  }

  await enforceRateLimit(domainActionRateLimit, session.user.id);

  const domain = normalizeDomain(validated.domainRaw);
  const verificationToken = uuidv4();

  try {
    await db.insert(organizationDomains).values({
      id: uuidv4(),
      organizationId: validated.orgId,
      domain,
      verificationToken,
      isVerified: false,
    });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error?.code === '23505' || error?.message?.includes('unique constraint')) {
      throw new Error("Este domínio já está registrado por outra organização.");
    }
    throw err;
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, session.session.activeOrganizationId!),
  });

  if (org) {
    revalidatePath(`/org/${org.slug}/settings/sso`);
    
    await recordAuditLog({
      organizationId: validated.orgId,
      action: "DOMAIN_ADDED",
      entityType: "DOMAIN",
      details: `Adicionado domínio ${domain} para verificação.`,
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      }
    });
  }
  return { success: true, verificationToken };
}

export async function verifyDomainAction(orgId: string, domainId: string) {
  const validated = verifyDomainSchema.parse({ orgId, domainId });

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.session.activeOrganizationId !== validated.orgId) {
    throw new Error("Unauthorized");
  }

  await enforceRateLimit(domainActionRateLimit, session.user.id);

  const domainRecord = await db.query.organizationDomains.findFirst({
    where: and(
      eq(organizationDomains.id, validated.domainId),
      eq(organizationDomains.organizationId, validated.orgId)
    ),
  });

  if (!domainRecord) {
    throw new Error("Domain not found");
  }

  const isValid = await verifyDomainTXT(domainRecord.domain, domainRecord.verificationToken);

  if (isValid) {
    await db
      .update(organizationDomains)
      .set({ isVerified: true, updatedAt: new Date() })
      .where(eq(organizationDomains.id, validated.domainId));

    await recordAuditLog({
      organizationId: validated.orgId,
      action: "DOMAIN_VERIFIED",
      entityType: "DOMAIN",
      entityId: validated.domainId,
      details: `Domínio ${domainRecord.domain} verificado com sucesso via DNS.`,
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      }
    });
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, session.session.activeOrganizationId!),
  });

  if (org) {
    revalidatePath(`/org/${org.slug}/settings/sso`);
  }
  return { success: isValid };
}

export async function deleteDomainAction(orgId: string, domainId: string) {
  const validated = deleteDomainSchema.parse({ orgId, domainId });

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.session.activeOrganizationId !== validated.orgId) {
    throw new Error("Unauthorized");
  }

  await enforceRateLimit(domainActionRateLimit, session.user.id);

  await db
    .delete(organizationDomains)
    .where(
      and(
        eq(organizationDomains.id, validated.domainId),
        eq(organizationDomains.organizationId, validated.orgId)
      )
    );

  await recordAuditLog({
    organizationId: validated.orgId,
    action: "DOMAIN_REMOVED",
    entityType: "DOMAIN",
    entityId: validated.domainId,
    details: `Domínio de verificação removido.`,
    actor: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    }
  });

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, session.session.activeOrganizationId!),
  });

  if (org) {
    revalidatePath(`/org/${org.slug}/settings/sso`);
  }
  return { success: true };
}

export async function updateSSOConfigAction(orgId: string, data: {
  providerId: string;
  clientId: string;
  clientSecret?: string;
  issuer?: string;
  isActive: boolean;
}) {
  const validated = updateSSOConfigSchema.parse({ orgId, data });

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.session.activeOrganizationId !== validated.orgId) {
    throw new Error("Unauthorized");
  }

  await enforceRateLimit(ssoActionRateLimit, session.user.id);

  const existing = await db.query.ssoConfigs.findFirst({
    where: and(
      eq(ssoConfigs.organizationId, validated.orgId),
      eq(ssoConfigs.providerId, validated.data.providerId)
    ),
  });

  const dataToStore = { ...validated.data, updatedAt: new Date() };
  
  // Encrypt clientSecret at rest
  if (dataToStore.clientSecret) {
    const { encrypt } = await import("@/lib/security/crypto");
    dataToStore.clientSecret = encrypt(dataToStore.clientSecret);
  }

  if (existing) {
    await db
      .update(ssoConfigs)
      .set(dataToStore)
      .where(eq(ssoConfigs.id, existing.id));
  } else {
    await db.insert(ssoConfigs).values({
      id: uuidv4(),
      organizationId: validated.orgId,
      ...validated.data,
    });
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, session.session.activeOrganizationId!),
  });

  if (org) {
    revalidatePath(`/org/${org.slug}/settings/sso`);
  }

  // Sync to Better-Auth sso_provider table
  // We sync all verified domains for this organization to use this SSO config
  const verifiedDomains = await db.query.organizationDomains.findMany({
    where: and(
      eq(organizationDomains.organizationId, validated.orgId),
      eq(organizationDomains.isVerified, true)
    ),
  });

  if (verifiedDomains.length > 0) {
    const oidcConfig = validated.data.issuer ? JSON.stringify({
      issuer: validated.data.issuer,
      clientId: validated.data.clientId,
      clientSecret: dataToStore.clientSecret, // Store encrypted secret if exists, or clear it if not
    }) : null;

    // Delete existing providers for this org to resync
    await db.delete(ssoProviders).where(eq(ssoProviders.organizationId, validated.orgId));

    // Insert new providers for each verified domain
    if (validated.data.isActive) {
      for (const domainRecord of verifiedDomains) {
        await db.insert(ssoProviders).values({
          id: uuidv4(),
          issuer: validated.data.issuer || "OIDC Provider",
          providerId: validated.data.providerId, // e.g., 'oidc'
          domain: domainRecord.domain,
          organizationId: validated.orgId,
          userId: session.user.id,
          oidcConfig: oidcConfig,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }

  await recordAuditLog({
    organizationId: validated.orgId,
    action: "SSO_CONFIG_UPDATED",
    entityType: "SSO",
    details: `Configuração de SSO ${validated.data.isActive ? "ativada" : "desativada"} para ${validated.data.providerId}.`,
    actor: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    }
  });

  return { success: true };
}

/**
 * Public action to check if an email domain has an active SSO provider.
 * Used by the login form for automatic detection.
 */
export async function checkSSOAvailabilityAction(email: string) {
  try {
    const validatedEmail = emailSchema.parse(email);
    const domain = normalizeDomain(validatedEmail.split("@")[1] || "");
    if (!domain) return { available: false };

    const provider = await db.query.ssoProviders.findFirst({
      where: eq(ssoProviders.domain, domain),
    });

    return {
      available: !!provider,
      domain,
      providerId: provider?.providerId,
    };
  } catch (error) {
    console.error("Error checking SSO availability:", error);
    return { available: false };
  }
}
