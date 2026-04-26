import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizationDomains, ssoConfigs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SSOSettings } from "@/components/dashboard/settings/SSOSettings";

export default async function SSOSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.organization || session.organization.slug !== orgSlug) {
    redirect("/login");
  }

  const orgId = session.organization.id;

  const domains = await db.query.organizationDomains.findMany({
    where: eq(organizationDomains.organizationId, orgId),
  });

  const configs = await db.query.ssoConfigs.findMany({
    where: eq(ssoConfigs.organizationId, orgId),
  }) as { providerId: string; clientId: string; isActive: boolean; clientSecret?: string | null; issuer?: string | null }[];

  return (
    <SSOSettings 
      organizationId={orgId}
      domains={domains}
      ssoConfigs={configs}
    />
  );
}
