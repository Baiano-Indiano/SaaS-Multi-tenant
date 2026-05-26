import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations, auditLogs } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getTenantDb } from "@/lib/db/tenant-db";
import { ActivityLogFeed, type AuditLog } from "@/components/settings/ActivityLog";
import { Activity, FileDown, FileJson } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { GsapEntrance } from "@/components/ui/gsap-entrance";
import { getTranslations } from "next-intl/server";

export default async function ActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { orgSlug } = await params;
  const { q, type } = await searchParams;
  const t = await getTranslations("Settings.activity");
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
      <GsapEntrance>
        <div>
          <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-zinc-400" />
            {t("title")}
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            {t("description")}
          </p>
        </div>
      </GsapEntrance>

      <ActivityLogFeed logs={logs as AuditLog[]} />

      <GsapEntrance delay={0.1}>
        <Card className="bg-zinc-950/40 border-zinc-900 shadow-lg">
          <CardContent className="p-6">
            <h4 className="text-md font-semibold text-zinc-200">
              {t("exportTitle")}
            </h4>
            <p className="text-xs text-zinc-400 mt-1 mb-4">
              {t("exportDescription")}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`/api/org/${orgSlug}/reports?format=pdf`}
                download
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:text-zinc-100 text-zinc-300 gap-2 cursor-pointer"
                )}
              >
                <FileDown className="h-4 w-4" />
                {t("downloadPdf")}
              </a>
              <a
                href={`/api/org/${orgSlug}/reports?format=json`}
                download
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:text-zinc-100 text-zinc-300 gap-2 cursor-pointer"
                )}
              >
                <FileJson className="h-4 w-4" />
                {t("downloadJson")}
              </a>
            </div>
          </CardContent>
        </Card>
      </GsapEntrance>
    </div>
  );
}
