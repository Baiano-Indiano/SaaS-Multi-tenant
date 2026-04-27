import { db } from "@/lib/db";
import { statusComponents, statusIncidents, organizations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { StatusSettings } from "@/components/dashboard/settings/StatusSettings";
import { notFound } from "next/navigation";

export default async function StatusSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) notFound();

  const components = await db.query.statusComponents.findMany({
    where: eq(statusComponents.organizationId, org.id),
    orderBy: [desc(statusComponents.createdAt)],
  });

  const incidents = await db.query.statusIncidents.findMany({
    where: eq(statusIncidents.organizationId, org.id),
    orderBy: [desc(statusIncidents.createdAt)],
    limit: 10,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Status Page</h1>
        <p className="text-zinc-400">
          Gerencie a transparência do seu sistema para seus usuários finais.
        </p>
      </div>

      <StatusSettings 
        organizationId={org.id}
        orgSlug={orgSlug}
        components={components.map(c => ({
          ...c,
          status: c.status as "operational" | "degraded" | "partial_outage" | "major_outage"
        }))}
        incidents={incidents.map(i => ({
          ...i,
          status: i.status as "investigating" | "identified" | "monitoring" | "resolved",
          severity: i.severity as "minor" | "major" | "critical"
        }))}
      />
    </div>
  );
}
