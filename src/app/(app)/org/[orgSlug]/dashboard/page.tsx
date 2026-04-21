import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { getDashboardStatsAction } from '@/app/actions/analytics';
import { AnalyticsWidgets } from '@/components/dashboard/AnalyticsWidgets';
import { LampCeiling, Rocket } from 'lucide-react';

export default async function OrgDashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/login');

  // Fetch organization to get the ID
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) notFound();

  // Fetch consolidated analytics
  // Note: Defensive check (D-04) happens inside the action via getTenantDb
  const result = await getDashboardStatsAction(org.id);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black text-zinc-100 tracking-tight">Organization Overview</h1>
        <p className="text-zinc-400 mt-1">
          Managing <span className="text-zinc-100 font-semibold">{org.name}</span>
        </p>
      </div>

      <AnalyticsWidgets stats={result.stats} />

      {/* Quick Actions or secondary data could go here */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 flex flex-col justify-center items-center text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
            <LampCeiling className="h-6 w-6 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100">Pro Tip</h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-xs">
              Use the sidebar to manage roles and team permissions specifically for this organization schema.
            </p>
          </div>
        </div>
        
        <div className="rounded-xl border border-zinc-800 bg-emerald-500/5 p-8 flex flex-col justify-center items-center text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Rocket className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-500">Fast Deploy</h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-xs">
              Your projects are isolated and ready for secure external access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
