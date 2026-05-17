import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsWidgets } from "@/components/dashboard/AnalyticsWidgets";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { MagneticCard } from "@/components/dashboard/MagneticCard";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { DashboardContentClient } from "@/components/dashboard/dashboard-content-client";
import { TechnicalHeader } from "@/components/dashboard/TechnicalHeader";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { LogStream } from "@/components/dashboard/LogStream";
import { getTranslations } from "next-intl/server";
import { SubsystemHealth } from "@/components/dashboard/SubsystemHealth";
import { OverviewChart, AreaChart } from "@/components/dashboard/dashboard-charts";
import { auth } from "@/lib/auth/index";
import { headers } from "next/headers";
import { getDashboardStats, getRecentActivity, getAdvancedAnalytics } from "@/lib/api/stats";
import { GlobalTrafficMap } from "@/components/dashboard/GlobalTrafficMap";
import { InfraHealthMonitor } from "@/components/dashboard/InfraHealthMonitor";
import { UsageQuotas } from "@/components/dashboard/UsageQuotas";
import { DiagnosticsTools } from "@/components/dashboard/DiagnosticsTools";
import { redirect } from "next/navigation";
import { getRoles, can } from "@/lib/auth/rbac-utils";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardPage() {
  const t = await getTranslations("Dashboard");
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const orgId = session.session.activeOrganizationId;

  if (!orgId) {
    return (
        <DashboardClient>
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl">
                    <span className="text-2xl">🏢</span>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">No Active Organization</h2>
                <p className="text-zinc-500 max-w-xs font-medium">Please select or create an organization to access your command center.</p>
            </div>
        </DashboardClient>
    );
  }

  const [stats, activities, advancedAnalytics, org] = await Promise.all([
    getDashboardStats(orgId),
    getRecentActivity(orgId),
    getAdvancedAnalytics(orgId),
    db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    })
  ]);

  if (!org) {
    return redirect("/org/create");
  }

  const [roles, canCreateProject, canInviteMember, canManageApiKeys] = await Promise.all([
    getRoles(orgId),
    can(session.user.id, orgId, "projects:create"),
    can(session.user.id, orgId, "members:invite"),
    can(session.user.id, orgId, "org:update")
  ]);


  return (
    <DashboardClient>
      <TechnicalHeader tenantName={stats.orgName} />

      <DashboardContentClient>
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-16">
          {/* Main Content Area (80%) */}
          <div className="lg:col-span-8 space-y-16">
            <section className="dashboard-section space-y-12">
              <GlobalTrafficMap logs={advancedAnalytics.logs} />
              <SubsystemHealth />
              <AnalyticsWidgets stats={stats} />
            </section>

            <div className="grid gap-10 md:grid-cols-2">
              <MagneticCard className="h-full">
                <Card className="bg-transparent border-none shadow-none overflow-hidden group h-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                        {t("resourceDistribution")}
                      </CardTitle>
                      <CardDescription className="text-zinc-500 font-medium mt-1">
                        {t("resourceDistributionDescription")}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">{t("live")}</span>
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

              <MagneticCard className="h-full">
                <Card className="bg-transparent border-none shadow-none overflow-hidden h-full">
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
                       { date: "Month 1", value: Math.floor(stats.totalProjects * 0.2) },
                       { date: "Month 2", value: Math.floor(stats.totalProjects * 0.4) },
                       { date: "Month 3", value: Math.floor(stats.totalProjects * 0.5) },
                       { date: "Month 4", value: Math.floor(stats.totalProjects * 0.7) },
                       { date: "Month 5", value: Math.floor(stats.totalProjects * 0.9) },
                       { date: "Month 6", value: stats.totalProjects },
                     ]} />
                  </CardContent>
                </Card>
              </MagneticCard>
            </div>

            <MagneticCard>
              <Card className="bg-transparent border-none shadow-none h-full">
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
          </div>

          {/* Technical Rail (20%) */}
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-4">
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 px-1 border-l-2 border-emerald-500/50 pl-3 ml-1">
                 Quick Operations
               </h2>
                <QuickActions
                  orgId={orgId}
                  orgSlug={org.slug!}
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
                 Live Feed
               </h2>
               <LogStream />
            </div>

            <div className="space-y-4">
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 px-1 border-l-2 border-amber-500/50 pl-3 ml-1">
                 Health & Usage
               </h2>
               <InfraHealthMonitor
                 latencyTrend={advancedAnalytics.latencyTrend}
                 systemLoad={advancedAnalytics.systemLoad}
               />
               <UsageQuotas stats={stats} />
            </div>

            <DiagnosticsTools
              logs={advancedAnalytics.logs}
              cacheStats={advancedAnalytics.cacheMetrics}
            />
          </div>
        </div>
      </DashboardContentClient>
    </DashboardClient>
  );
}
