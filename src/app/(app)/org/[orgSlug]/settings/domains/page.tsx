import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DomainManagement } from "@/components/settings/DomainManagement";
import { PLANS, PlanType } from "@/lib/billing/plans";

export default async function DomainSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/login");

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) redirect("/selecionar-org");

  const currentPlan = PLANS[org.plan.toUpperCase() as PlanType];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Domínios Enterprise</h3>
        <p className="text-zinc-500 dark:text-zinc-400">
          Configure e gerencie domínios customizados para sua organização.
        </p>
      </div>

      <DomainManagement 
        orgId={org.id}
        initialDomain={org.customDomain}
        initialVerified={org.domainVerified}
        hasCustomDomainPlan={currentPlan?.customDomains || false}
      />
    </div>
  );
}
