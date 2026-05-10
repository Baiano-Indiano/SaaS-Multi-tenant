import { SettingsNav } from "@/components/settings/settings-nav";
import { getTranslations } from "next-intl/server";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const t = await getTranslations("Settings.nav");
  const { orgSlug } = await params;

  const navItems = [
    {
      title: t("general"),
      href: `/org/${orgSlug}/settings`,
    },
    {
      title: t("activity"),
      href: `/org/${orgSlug}/settings/activity`,
    },
    {
      title: t("security"),
      href: `/org/${orgSlug}/settings/security`,
    },
    {
      title: t("connectivity"),
      href: `/org/${orgSlug}/settings/connectivity`,
    },
    {
      title: t("integrations"),
      href: `/org/${orgSlug}/settings/integrations`,
    },
    {
      title: t("sso"),
      href: `/org/${orgSlug}/settings/sso`,
    },
    {
      title: t("statusPage"),
      href: `/org/${orgSlug}/settings/status`,
    },
    {
      title: t("billing"),
      href: `/org/${orgSlug}/settings/billing`,
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
