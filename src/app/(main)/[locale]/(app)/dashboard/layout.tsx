import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { getTranslations } from "next-intl/server";
import { CommandMenuTrigger } from "@/components/layout/command-menu";

// Legacy /dashboard route — kept for backward compatibility.
// New tenant-scoped pages use /org/[orgSlug]/dashboard instead.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("Navigation");
  return (
    <SidebarProvider>
      {/* Pass empty arrays for the old route — org context comes from /org/[orgSlug] */}
      <AppSidebar organizations={[]} activeOrgId={null} />
      <main className="flex-1 overflow-hidden h-screen bg-zinc-950 flex flex-col">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 bg-zinc-950/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="font-medium text-zinc-100">{t("dashboard")}</div>
          </div>
          <div className="flex items-center gap-4">
            <CommandMenuTrigger />
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
