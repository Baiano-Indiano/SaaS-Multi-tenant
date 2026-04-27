import { SettingsNav } from "@/components/settings/settings-nav";
import { Separator } from "@/components/ui/separator";
import { getTranslations } from "next-intl/server";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("Account");

  const navItems = [
    {
      title: t("profile"),
      href: `/account/profile`,
    },
    {
      title: t("security"),
      href: `/account/security`,
    },
  ];

  return (
    <div className="space-y-6 p-10 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">{t("title")}</h2>
        <p className="text-muted-foreground">
          {t("description")}
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
