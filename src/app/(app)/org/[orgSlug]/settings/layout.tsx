import { Separator } from "@/components/ui/separator";
import { SettingsNav } from "@/components/settings/settings-nav";

interface SettingsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

const sidebarNavItems = [
  {
    title: "General",
    href: "settings",
  },
  {
    title: "Members",
    href: "settings/members",
  },
  {
    title: "Roles & Permissions",
    href: "settings/roles",
  },
  {
    title: "Billing",
    href: "settings/billing",
  },
  {
    title: "Activity Log",
    href: "settings/activity",
  },
];

export default async function SettingsLayout({
  children,
  params,
}: SettingsLayoutProps) {
  const { orgSlug } = await params;
  const navItems = sidebarNavItems.map((item) => ({
    ...item,
    href: `/org/${orgSlug}/${item.href}`,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Settings</h2>
        <p className="text-zinc-400">
          Manage your organization settings, members, and permissions.
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
