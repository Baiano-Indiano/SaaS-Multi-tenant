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

export async function addDomainAction(orgId: string, domainRaw: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.session.activeOrganizationId !== orgId) {
    throw new Error("Unauthorized");
  }

  const domain = normalizeDomain(domainRaw);
  const verificationToken = uuidv4();

  try {
    await db.insert(organizationDomains).values({
      id: uuidv4(),
      organizationId: orgId,
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
      organizationId: orgId,
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.session.activeOrganizationId !== orgId) {
    throw new Error("Unauthorized");
  }

  const domainRecord = await db.query.organizationDomains.findFirst({
    where: and(
      eq(organizationDomains.id, domainId),
      eq(organizationDomains.organizationId, orgId)
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
      .where(eq(organizationDomains.id, domainId));

    await recordAuditLog({
      organizationId: orgId,
      action: "DOMAIN_VERIFIED",
      entityType: "DOMAIN",
      entityId: domainId,
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.session.activeOrganizationId !== orgId) {
    throw new Error("Unauthorized");
  }

  await db
    .delete(organizationDomains)
    .where(
      and(
        eq(organizationDomains.id, domainId),
        eq(organizationDomains.organizationId, orgId)
      )
    );

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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.session.activeOrganizationId !== orgId) {
    throw new Error("Unauthorized");
  }

  const existing = await db.query.ssoConfigs.findFirst({
    where: and(
      eq(ssoConfigs.organizationId, orgId),
      eq(ssoConfigs.providerId, data.providerId)
    ),
  });

  if (existing) {
    await db
      .update(ssoConfigs)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(ssoConfigs.id, existing.id));
  } else {
    await db.insert(ssoConfigs).values({
      id: uuidv4(),
      organizationId: orgId,
      ...data,
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
      eq(organizationDomains.organizationId, orgId),
      eq(organizationDomains.isVerified, true)
    ),
  });

  if (verifiedDomains.length > 0) {
    const oidcConfig = data.issuer ? JSON.stringify({
      issuer: data.issuer,
      clientId: data.clientId,
      clientSecret: data.clientSecret,
    }) : null;

    // Delete existing providers for this org to resync
    await db.delete(ssoProviders).where(eq(ssoProviders.organizationId, orgId));

    // Insert new providers for each verified domain
    if (data.isActive) {
      for (const domainRecord of verifiedDomains) {
        await db.insert(ssoProviders).values({
          id: uuidv4(),
          issuer: data.issuer || "OIDC Provider",
          providerId: data.providerId, // e.g., 'oidc'
          domain: domainRecord.domain,
          organizationId: orgId,
          userId: session.user.id,
          oidcConfig: oidcConfig,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }

  return { success: true };
}

/**
 * Public action to check if an email domain has an active SSO provider.
 * Used by the login form for automatic detection.
 */
export async function checkSSOAvailabilityAction(email: string) {
  try {
    const domain = normalizeDomain(email.split("@")[1] || "");
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
