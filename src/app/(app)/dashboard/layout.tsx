import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-hidden h-screen bg-zinc-950 flex flex-col">
        <header className="h-16 border-b border-zinc-800 flex items-center px-4 shrink-0 bg-zinc-950/50 backdrop-blur-sm">
          <SidebarTrigger />
          <div className="ml-4 font-medium text-zinc-100">Dashboard</div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
