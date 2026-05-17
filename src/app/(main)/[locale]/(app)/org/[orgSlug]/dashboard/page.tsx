import * as React from "react";
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { DashboardContentClient } from "@/components/dashboard/dashboard-content-client";
import { TechnicalHeader } from "@/components/dashboard/TechnicalHeader";
import { AnalyticsWidgets } from '@/components/dashboard/AnalyticsWidgets';
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { MagneticCard } from "@/components/dashboard/MagneticCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { getRoles, can } from "@/lib/auth/rbac-utils";
import { LogStream } from "@/components/dashboard/LogStream";
import { SubsystemHealth } from "@/components/dashboard/SubsystemHealth";
import { OverviewChart, AreaChart } from "@/components/dashboard/dashboard-charts";
import { GlobalTrafficMap } from "@/components/dashboard/GlobalTrafficMap";
import { InfraHealthMonitor } from "@/components/dashboard/InfraHealthMonitor";
import { UsageQuotas } from "@/components/dashboard/UsageQuotas";
import { DiagnosticsTools } from "@/components/dashboard/DiagnosticsTools";
import { getDashboardStats, getRecentActivity, getAdvancedAnalytics } from "@/lib/api/stats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OrgDashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const t = await getTranslations('Dashboard');
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect('/login');

  // Fetch organization to get the ID
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) notFound();

  // Fetch consolidated analytics using the common lib functions
  const [stats, activities, advancedAnalytics, roles] = await Promise.all([
    getDashboardStats(org.id),
    getRecentActivity(org.id),
    getAdvancedAnalytics(org.id),
    getRoles(org.id)
  ]);

  // RBAC permissions for Quick Actions
  const [canCreateProject, canInviteMember, canManageApiKeys] = await Promise.all([
    can(session.user.id, org.id, "projects:create"),
    can(session.user.id, org.id, "members:invite"),
    can(session.user.id, org.id, "org:update") // Permission for API Keys
  ]);


  return (
    <DashboardClient>
      <TechnicalHeader tenantName={org.name} />

      <DashboardContentClient>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Traffic & Health (7/12) */}
          <div className="lg:col-span-7 space-y-8">
            <section className="dashboard-section">
              <GlobalTrafficMap logs={advancedAnalytics.logs} />
            </section>

            <section className="dashboard-section">
              <SubsystemHealth />
            </section>

            <section className="dashboard-section">
              <AnalyticsWidgets stats={stats} />
            </section>

            <section className="dashboard-section grid gap-8 md:grid-cols-2">
              <MagneticCard className="h-full border-none bg-transparent backdrop-blur-none">
                <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-sm shadow-xl overflow-hidden group h-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                        {t("resourceDistribution")}
                      </CardTitle>
                      <CardDescription className="text-zinc-500 font-medium mt-1">
                        {t("resourceDistributionDescription")}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-2 pb-6 min-h-[250px] flex items-end">
                    <OverviewChart data={[
                      { name: t("projects"), total: stats.totalProjects },
                      { name: t("members"), total: stats.totalMembers },
                      { name: t("invitations"), total: stats.pendingInvites },
                    ]} />
                  </CardContent>
                </Card>
              </MagneticCard>

              <MagneticCard className="h-full border-none bg-transparent backdrop-blur-none">
                <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-sm shadow-xl overflow-hidden h-full">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                      {t("growthAnalytics")}
                    </CardTitle>
                    <CardDescription className="text-zinc-500 font-medium">
                      {t("growthAnalyticsDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center min-h-[250px]">
                     <AreaChart data={[
                       { date: "M1", value: Math.floor(stats.totalProjects * 0.2) },
                       { date: "M2", value: Math.floor(stats.totalProjects * 0.4) },
                       { date: "M3", value: Math.floor(stats.totalProjects * 0.5) },
                       { date: "M4", value: Math.floor(stats.totalProjects * 0.7) },
                       { date: "M5", value: Math.floor(stats.totalProjects * 0.9) },
                       { date: "M6", value: stats.totalProjects },
                     ]} />
                  </CardContent>
                </Card>
              </MagneticCard>
            </section>
          </div>

          {/* Right Column: Activity & Rail (5/12) */}
          <div className="lg:col-span-5 space-y-8">
            <section className="dashboard-section">
              <MagneticCard>
                <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-sm shadow-xl h-full">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                      {t("recentActivity")}
                    </CardTitle>
                    <CardDescription className="text-zinc-500 font-medium">
                      {t("recentActivityDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                     <ActivityFeed activities={activities} />
                  </CardContent>
                </Card>
              </MagneticCard>
            </section>

            <section className="dashboard-section grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-8">
              <div className="space-y-4">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 px-1 border-l-2 border-emerald-500/50 pl-3 ml-1">
                   {t("quickOperations")}
                 </h2>
                 <QuickActions
                   orgId={org.id}
                   orgSlug={orgSlug}
                   roles={roles}
                   permissions={{
                     canCreateProject,
                     canInviteMember,
                     canManageApiKeys
                   }}
                 />
              </div>

              <div className="space-y-4">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 px-1 border-l-2 border-blue-500/50 pl-3 ml-1">
                   {t("liveFeed")}
                 </h2>
                 <LogStream />
              </div>
            </section>

            <section className="dashboard-section space-y-8">
              <div className="space-y-4">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 px-1 border-l-2 border-amber-500/50 pl-3 ml-1">
                   {t("healthUsage")}
                 </h2>
                 <div className="grid grid-cols-1 gap-4">
                   <InfraHealthMonitor
                     latencyTrend={advancedAnalytics.latencyTrend}
                     systemLoad={advancedAnalytics.systemLoad}
                   />
                   <UsageQuotas stats={stats} />
                 </div>
              </div>

              <DiagnosticsTools
                logs={advancedAnalytics.logs}
                cacheStats={advancedAnalytics.cacheMetrics}
              />
            </section>
          </div>
        </div>
      </DashboardContentClient>
    </DashboardClient>
  );
}
