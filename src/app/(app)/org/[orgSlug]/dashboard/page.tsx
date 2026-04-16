import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function OrgDashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/login');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-zinc-400 mt-1">
          Welcome to <span className="text-zinc-100 font-medium">{orgSlug}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Members', 'Projects', 'Activity'].map((card) => (
          <div
            key={card}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-6"
          >
            <h3 className="text-sm font-medium text-zinc-400">{card}</h3>
            <p className="text-2xl font-bold text-zinc-100 mt-2">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
