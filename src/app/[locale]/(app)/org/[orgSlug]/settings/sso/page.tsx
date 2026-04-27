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
  await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session?.activeOrganizationId) {
    redirect("/login");
  }

  const orgId = session.session.activeOrganizationId;

  const domains = await db.query.organizationDomains.findMany({
    where: eq(organizationDomains.organizationId, orgId),
  });

  const configs = await db.query.ssoConfigs.findMany({
    where: eq(ssoConfigs.organizationId, orgId),
  });

  return (
    <SSOSettings 
      organizationId={orgId}
      domains={domains}
      ssoConfigs={configs}
    />
  );
}
