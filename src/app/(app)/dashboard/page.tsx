import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { AnalyticsWidgets } from "@/components/dashboard/AnalyticsWidgets";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

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
  return (
    <DashboardClient>
      <div className="dashboard-header">
        <h1 className="text-3xl font-black tracking-tighter text-zinc-50 uppercase">
          Dashboard
        </h1>
        <p className="text-zinc-500 mt-1 font-medium">
          Manage your organization resources and monitor activity in real-time.
        </p>
      </div>

      <div className="dashboard-section">
        <AnalyticsWidgets stats={mockStats} />
      </div>

      <div className="dashboard-section grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart />
          </CardContent>
        </Card>
        
        <Card className="col-span-3 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
              Recent Activity
            </CardTitle>
            <CardDescription className="text-zinc-500 font-medium">
              Real-time feed of organization events.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <ActivityFeed />
          </CardContent>
        </Card>
      </div>
    </DashboardClient>
  );
}
