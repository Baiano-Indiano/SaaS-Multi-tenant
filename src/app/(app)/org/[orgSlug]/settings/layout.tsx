import { SettingsNav } from "@/components/settings/settings-nav";
import { Separator } from "@/components/ui/separator";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  const navItems = [
    {
      title: "General",
      href: `/org/${orgSlug}/settings/general`,
    },
    {
      title: "Members",
      href: `/org/${orgSlug}/settings/members`,
    },
    {
      title: "Activity",
      href: `/org/${orgSlug}/settings/activity`,
    },
  ];

  return (
    <div className="space-y-6 p-10 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Settings</h2>
        <p className="text-muted-foreground">
          Manage your organization settings, team members, and monitor activity logs.
        </p>
      </div>
      <Separator className="bg-zinc-800" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SettingsNav items={navItems} />
        </aside>
        <div className="flex-1 lg:max-w-4xl">{children}</div>
      </div>
    </div>
  );
}
