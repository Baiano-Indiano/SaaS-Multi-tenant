import { NavDashboardButton } from '@/components/layout/nav-dashboard-button';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col">
      <header className="flex items-center justify-between p-6 border-b border-zinc-800">
        <div className="text-xl font-bold tracking-tight">SaaS Multi-tenant</div>
        <nav className="flex items-center gap-4">
          <a href="/login" className="text-sm font-medium hover:text-zinc-300 transition-colors">Log in</a>
          <NavDashboardButton />
        </nav>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="py-12 border-t border-zinc-800 text-center text-sm text-zinc-400">
        &copy; {new Date().getFullYear()} SaaS Multi-tenant. All rights reserved.
      </footer>
    </div>
  );
}
