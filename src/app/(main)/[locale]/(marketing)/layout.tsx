import { MarketingHeader } from '@/components/layout/marketing-header';
import { AnimatedBackground } from '@/components/marketing/AnimatedBackground';
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
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col relative overflow-hidden">
      {/* Premium Animated Background */}
      <AnimatedBackground />

      <MarketingHeader 
        brandName={tMarketing("brandName")} 
        loginText={tNav("login")} 
      />
      <main className="flex-1 pt-24 md:pt-28 relative z-10">
        {children}
      </main>
      <footer className="py-12 border-t border-zinc-800 text-center text-sm text-zinc-400 relative z-10 bg-zinc-950/40 backdrop-blur-sm">
        &copy; {new Date().getFullYear()} {tMarketing("brandName")}. {tFooter('allRightsReserved')}
      </footer>
    </div>
  );
}
