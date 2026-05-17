import { StatsSkeleton, ChartSkeleton, AreaChartSkeleton, ActivitySkeleton } from "@/components/dashboard/DashboardSkeletons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

export default async function DashboardLoading() {
  const t = await getTranslations("Dashboard");

  return (
    <div className="animate-in fade-in duration-500">
      <div className="dashboard-header mb-8">
        <h1 className="text-3xl font-black tracking-tighter text-zinc-50 uppercase">
          {t("title")}
        </h1>
        <p className="text-zinc-500 mt-1 font-medium">
          {t("subtitle")}
        </p>
      </div>

      <div>
        <div className="dashboard-section mb-8">
          <StatsSkeleton />
        </div>

        <div className="dashboard-section grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
          <div className="col-span-4">
            <Card className="bg-zinc-900/50 border-zinc-800 h-full">
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
              <CardContent className="pl-2 pb-6 min-h-[200px]">
                <ChartSkeleton />
              </CardContent>
            </Card>
          </div>
          
          <div className="col-span-3">
            <Card className="bg-zinc-900/50 border-zinc-800 h-full">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                  {t("growthAnalytics")}
                </CardTitle>
                <CardDescription className="text-zinc-500 font-medium">
                  {t("growthAnalyticsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center min-h-[200px]">
                 <AreaChartSkeleton />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="dashboard-section grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="bg-zinc-900/50 border-zinc-800 h-full">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                  {t("recentActivity")}
                </CardTitle>
                <CardDescription className="text-zinc-500 font-medium">
                  {t("recentActivityDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <ActivitySkeleton />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
             <Card className="bg-zinc-900/50 border-zinc-800 border-l-emerald-500 border-l-4">
                <div className="h-24" /> {/* Space for health widget */}
             </Card>
             <Card className="bg-zinc-900/50 border-zinc-800 border-l-amber-500 border-l-4">
                <div className="h-24" /> {/* Space for tasks widget */}
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
