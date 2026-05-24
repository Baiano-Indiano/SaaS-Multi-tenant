import { NavDashboardButton } from '@/components/layout/nav-dashboard-button';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tNav = await getTranslations('Navigation');
  const tFooter = await getTranslations('Footer');
  const tMarketing = await getTranslations('Marketing');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col">
      <header className="flex items-center justify-between p-6 border-b border-zinc-800">
        <Link href="/" className="text-xl font-bold tracking-tight">{tMarketing("brandName")}</Link>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-zinc-300 transition-colors">
            {tNav('login')}
          </Link>
          <NavDashboardButton />
          <LocaleSwitcher />
        </nav>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="py-12 border-t border-zinc-800 text-center text-sm text-zinc-400">
        &copy; {new Date().getFullYear()} {tMarketing("brandName")}. {tFooter('allRightsReserved')}
      </footer>
    </div>
  );
}
