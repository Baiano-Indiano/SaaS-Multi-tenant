import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations, auditLogs } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getTenantDb } from "@/lib/db/tenant-db";
import { ActivityLogFeed, type AuditLog } from "@/components/settings/ActivityLog";
import { Activity } from "lucide-react";

export default async function ActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { orgSlug } = await params;
  const { q, type } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/login");

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) redirect("/selecionar-org");

  // Fetch logs using Tenant Context
  const logs = await getTenantDb(
    session.user.id,
    org.id,
    async (tx) => {
      // Build filters
      const conditions = [];
      
      if (type && type !== "all") {
        conditions.push(eq(auditLogs.entityType, type.toUpperCase()));
      }
      
      if (q) {
        conditions.push(
          sql`(${auditLogs.action} ILIKE ${`%${q}%`} OR ${auditLogs.details} ILIKE ${`%${q}%`} OR ${auditLogs.userName} ILIKE ${`%${q}%`})`
        );
      }

      return await tx.query.auditLogs.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: (logs, { desc }) => [desc(logs.createdAt)],
        limit: 100, // Enterprise limit for initial load
      });
    }
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Activity className="h-5 w-5 text-zinc-400" />
          Activity Log
        </h3>
        <p className="text-sm text-zinc-400 mt-1">
          Monitor all administrative actions and security events within your organization.
        </p>
      </div>

      <ActivityLogFeed logs={logs as AuditLog[]} />
    </div>
  );
}
