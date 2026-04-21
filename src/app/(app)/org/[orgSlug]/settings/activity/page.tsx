import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { can } from "@/lib/auth/rbac-utils";
import { getAuditLogsAction } from "@/app/actions/audit";
import { ActivityLogFeed } from "@/components/settings/ActivityLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
}

export default async function ActivityPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params;
  const { q, type } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/login");

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) redirect("/selecionar-org");

  // Check permission
  const hasPermission = await can(session.user.id, org.id, "audit_logs:read");
  
  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h3 className="text-xl font-bold text-zinc-100">Access Denied</h3>
        <p className="text-zinc-400 max-w-sm mt-2">
          You don&apos;t have the required permissions to view the activity log for this organization.
        </p>
      </div>
    );
  }

  const logs = await getAuditLogsAction(org.id, {
    query: q,
    entityType: type,
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-zinc-100">Activity Log</h3>
        <p className="text-sm text-zinc-400">
          Track all administrative actions performed in your organization.
        </p>
      </div>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Audit Trail</CardTitle>
          <CardDescription className="text-zinc-400">
            Showing the latest 100 activities. Data is retained for 90 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityLogFeed logs={logs} />
        </CardContent>
      </Card>
    </div>
  );
}
