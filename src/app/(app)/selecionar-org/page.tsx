import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { members, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Building2 } from 'lucide-react';
import Link from 'next/link';
import { CreateOrgTrigger } from '@/components/create-org-trigger';

export default async function SelectOrgPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/login');

  // Manual join since Drizzle relations aren't defined in schema.ts
  const userMemberships = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      logo: organizations.logo,
    })
    .from(members)
    .innerJoin(organizations, eq(organizations.id, members.organizationId))
    .where(eq(members.userId, session.user.id));

  const orgs = userMemberships;

  // If user has exactly 1 org, auto-redirect (no need to show the picker)
  if (orgs.length === 1 && orgs[0].slug) {
    redirect(`/org/${orgs[0].slug}/dashboard`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-zinc-100">Select Organization</h1>
          <p className="text-zinc-400">Choose a workspace to continue.</p>
        </div>

        {orgs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-700 p-8 text-center">
            <Building2 className="mx-auto mb-4 size-12 text-zinc-600" />
            <p className="text-sm text-zinc-500">
              You&apos;re not part of any organization yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {orgs.map((org) => (
              <Link
                key={org.id}
                href={`/org/${org.slug}/dashboard`}
                className="flex w-full items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800"
              >
                <Building2 className="size-4 text-zinc-400" />
                {org.name}
              </Link>
            ))}
          </div>
        )}

        <CreateOrgTrigger />
      </div>
    </div>
  );
}
