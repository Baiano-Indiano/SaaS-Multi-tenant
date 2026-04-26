import { SettingsNav } from "@/components/settings/settings-nav";

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
      href: `/org/${orgSlug}/settings`,
    },
    {
      title: "Activity",
      href: `/org/${orgSlug}/settings/activity`,
    },
    {
      title: "Security",
      href: `/org/${orgSlug}/settings/security`,
    },
    {
      title: "Connectivity",
      href: `/org/${orgSlug}/settings/connectivity`,
    },
    {
      title: "Integrations",
      href: `/org/${orgSlug}/settings/integrations`,
    },
    {
      title: "SSO",
      href: `/org/${orgSlug}/settings/sso`,
    },
    {
      title: "Status Page",
      href: `/org/${orgSlug}/settings/status`,
    },
  ];

  return (
    <div className="space-y-6 p-8 pb-16">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-64 shrink-0">
          <SettingsNav items={navItems} />
        </aside>
        <div className="flex-1 lg:max-w-4xl">{children}</div>
      </div>
    </div>
  );
}
