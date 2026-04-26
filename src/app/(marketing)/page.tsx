import { HeroAssembly } from "@/components/marketing/HeroAssembly";
import { Button } from "@/components/ui/button";
import { BenefitsSection } from "@/components/marketing/BenefitsSection";
import { PricingSection } from "@/components/marketing/PricingSection";
import { FAQSection } from "@/components/marketing/FAQSection";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto px-6 pt-24 pb-12 md:pt-32 md:pb-16 flex flex-col items-center text-center">
        <ScrollReveal>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            The B2B SaaS Foundation <br className="hidden md:block" />
            <span className="text-zinc-400">You Can Build On.</span>
          </h1>
        </ScrollReveal>
        
        <ScrollReveal delay={0.1}>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Secure, tenant-isolated data architecture with flexible organization management that accelerates the launch of enterprise-ready applications.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-base" render={<a href="/register" />} nativeButton={false}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base border-zinc-700 hover:bg-zinc-800 text-zinc-300">
              Talk to Sales
            </Button>
          </div>
        </ScrollReveal>
      </section>

      {/* Product Reveal Assembly */}
      <div className="w-full">
        <HeroAssembly />
      </div>

      {/* Social Proof Section */}
      <section className="w-full border-y border-zinc-800 bg-zinc-900/20 py-12">
        <ScrollReveal>
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-sm font-medium text-zinc-500 mb-8 uppercase tracking-widest">Trusted by Enterprise Teams</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
              <div className="text-2xl font-bold tracking-tighter">Acme Corp</div>
              <div className="text-2xl font-bold tracking-tighter">Globex</div>
              <div className="text-2xl font-bold tracking-tighter">Soylent</div>
              <div className="text-2xl font-bold tracking-tighter">Initech</div>
              <div className="text-2xl font-bold tracking-tighter">Umbrella</div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Benefits Section (NEW) */}
      <BenefitsSection />

      {/* Features Bento Grid */}
      <section className="w-full max-w-6xl mx-auto px-6 py-24">
        <ScrollReveal>
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 tracking-tight">Everything you need to scale</h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
          <ScrollReveal direction="left" className="md:col-span-2">
            <div className="h-full rounded-2xl border border-zinc-800 bg-zinc-900 p-8 flex flex-col relative overflow-hidden group">
              <h3 className="text-2xl font-semibold mb-2 relative z-10">Schema-per-tenant Architecture</h3>
              <p className="text-zinc-400 relative z-10">Complete data isolation out of the box using PostgreSQL schemas. Unmatched security for enterprise clients.</p>
              <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-110"></div>
            </div>
          </ScrollReveal>
          
          <ScrollReveal direction="right">
            <div className="h-full rounded-2xl border border-zinc-800 bg-zinc-900 p-8 flex flex-col relative overflow-hidden group">
              <h3 className="text-2xl font-semibold mb-2 relative z-10">Role Based Access</h3>
              <p className="text-zinc-400 relative z-10">Granular permissions and role management dynamically assigned via generic middleware.</p>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-zinc-800/20 rounded-full blur-2xl -ml-8 -mb-8 transition-transform duration-700 group-hover:scale-110"></div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="left">
            <div className="h-full rounded-2xl border border-zinc-800 bg-zinc-900 p-8 flex flex-col relative overflow-hidden group">
              <h3 className="text-2xl font-semibold mb-2 relative z-10">Modern Auth</h3>
              <p className="text-zinc-400 relative z-10">Integrated with Better-Auth for robust identity management across organizations.</p>
              <div className="absolute top-1/2 left-1/2 w-48 h-48 -translate-x-1/2 -translate-y-1/2 bg-zinc-800/20 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-110"></div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" className="md:col-span-2">
            <div className="h-full rounded-2xl border border-zinc-800 bg-zinc-900 p-8 flex flex-col relative overflow-hidden group">
              <h3 className="text-2xl font-semibold mb-2 relative z-10">Premium UI Components</h3>
              <p className="text-zinc-400 relative z-10">Powered by Tailwind v4 and Shadcn/ui. Beautiful, accessible, and customizable components ready for your brand.</p>
              <div className="absolute bottom-0 right-0 w-56 h-56 bg-zinc-800/20 rounded-full blur-3xl -mr-12 -mb-12 transition-transform duration-700 group-hover:scale-110"></div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing Section (NEW) */}
      <PricingSection />

      {/* FAQ Section (NEW) */}
      <FAQSection />

      {/* Bottom CTA */}
      <section className="w-full border-t border-zinc-800 py-24 bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Ready to build your SaaS?</h2>
            <p className="text-xl text-zinc-400 mb-10">Stop rebuilding auth, billing, and organizations. Start building your product.</p>
            <Button size="lg" className="text-base px-8 py-6">
              Start Building Now
            </Button>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
