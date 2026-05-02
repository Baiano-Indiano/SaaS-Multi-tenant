"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organizationDomains, ssoConfigs, organizations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { verifyDomainTXT, normalizeDomain } from "@/lib/sso/dns";
import { revalidatePath } from "next/cache";

export async function addDomainAction(orgId: string, domainRaw: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.session.activeOrganizationId !== orgId) {
    throw new Error("Unauthorized");
  }

  const domain = normalizeDomain(domainRaw);
  const verificationToken = uuidv4();

  await db.insert(organizationDomains).values({
    id: uuidv4(),
    organizationId: orgId,
    domain,
    verificationToken,
    isVerified: false,
  });

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, session.session.activeOrganizationId!),
  });

  if (org) {
    revalidatePath(`/org/${org.slug}/settings/sso`);
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
  return { success: true };
}
