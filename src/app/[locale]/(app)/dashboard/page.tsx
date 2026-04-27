"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { AnalyticsWidgets } from "@/components/dashboard/AnalyticsWidgets";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { AreaChart } from "@/components/dashboard/area-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { StatsSkeleton, ChartSkeleton, AreaChartSkeleton, ActivitySkeleton } from "@/components/dashboard/DashboardSkeletons";
import { MagneticCard } from "@/components/dashboard/MagneticCard";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useTranslations } from "next-intl";

// Mock stats for the demonstration
const mockStats = {
  totalProjects: 12,
  totalMembers: 48,
  pendingInvites: 5,
  totalRoles: 4,
  quotas: {
    maxMembers: 100,
    maxProjects: 20,
  }
};

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const [isLoading, setIsLoading] = React.useState(true);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1800); // Premium loading duration
    return () => clearTimeout(timer);
  }, []);

  useGSAP(() => {
    if (!isLoading && contentRef.current) {
      gsap.from(contentRef.current.children, {
        opacity: 0,
        scale: 0.98,
        y: 10,
        duration: 0.8,
        stagger: 0.1,
        ease: "expo.out",
        clearProps: "all"
      });
    }
  }, [isLoading]);

  return (
    <DashboardClient>
      <div className="dashboard-header mb-8">
        <h1 className="text-3xl font-black tracking-tighter text-zinc-50 uppercase">
          {t("title")}
        </h1>
        <p className="text-zinc-500 mt-1 font-medium">
          {t("subtitle")}
        </p>
      </div>

      <div ref={contentRef}>
        <div className="dashboard-section mb-8">
          {isLoading ? (
            <StatsSkeleton />
          ) : (
            <AnalyticsWidgets stats={mockStats} />
          )}
        </div>

        <div className="dashboard-section grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
          <MagneticCard className="col-span-4" strength={10}>
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors overflow-hidden group h-full">
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
              <CardContent className="pl-2 pb-6 min-h-[200px]">
                {isLoading ? <ChartSkeleton /> : <OverviewChart />}
              </CardContent>
            </Card>
          </MagneticCard>
          
          <MagneticCard className="col-span-3" strength={10}>
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors overflow-hidden h-full">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                  {t("growthAnalytics")}
                </CardTitle>
                <CardDescription className="text-zinc-500 font-medium">
                  {t("growthAnalyticsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center min-h-[200px]">
                 {isLoading ? <AreaChartSkeleton /> : <AreaChart />}
              </CardContent>
            </Card>
          </MagneticCard>
        </div>

        <div className="dashboard-section grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <MagneticCard className="lg:col-span-2" strength={5}>
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors h-full">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                  {t("recentActivity")}
                </CardTitle>
                <CardDescription className="text-zinc-500 font-medium">
                  {t("recentActivityDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                 {isLoading ? <ActivitySkeleton /> : <ActivityFeed />}
              </CardContent>
            </Card>
          </MagneticCard>

          <div className="space-y-6">
             <Card className="bg-zinc-900/50 border-zinc-800 border-l-emerald-500 border-l-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">{t("systemHealth")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-300">{t("apiLatency")}</span>
                    <span className="text-xs font-bold text-emerald-500">24ms</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[15%]" />
                  </div>
                </CardContent>
             </Card>

             <Card className="bg-zinc-900/50 border-zinc-800 border-l-amber-500 border-l-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">{t("upcomingTasks")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-xs text-zinc-400 font-medium line-through decoration-zinc-600">{t("upgradeSchema")}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-xs text-white font-bold">{t("implementWebhooks")}</span>
                    </div>
                  </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </DashboardClient>
  );
}
