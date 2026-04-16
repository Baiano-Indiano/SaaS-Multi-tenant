import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizations, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect('/login');

  // Fetch org by slug
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  // D-04 (T-05): If org doesn't exist → redirect cleanly, no info leakage
  if (!org) redirect('/selecionar-org');

  // T-02: Validate user is a member of this org before granting access
  // Manual query since Drizzle relations aren't defined in schema.ts
  const membership = await db
    .select({ id: members.id })
    .from(members)
    .where(
      and(
        eq(members.organizationId, org.id),
        eq(members.userId, session.user.id)
      )
    )
    .limit(1);

  if (membership.length === 0) redirect('/selecionar-org');

  // Fetch all orgs the user belongs to (for the switcher)
  const userOrgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      logo: organizations.logo,
    })
    .from(members)
    .innerJoin(organizations, eq(organizations.id, members.organizationId))
    .where(eq(members.userId, session.user.id));

  return (
    <SidebarProvider>
      <AppSidebar organizations={userOrgs} activeOrgId={org.id} />
      <main className="flex-1 overflow-hidden h-screen bg-zinc-950 flex flex-col">
        <header className="h-16 border-b border-zinc-800 flex items-center px-4 shrink-0 bg-zinc-950/50 backdrop-blur-sm">
          <SidebarTrigger />
          <div className="ml-4 font-medium text-zinc-100">{org.name}</div>
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
