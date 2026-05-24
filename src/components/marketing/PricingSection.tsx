"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollReveal } from "./scroll-reveal";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { GsapCounter } from "@/components/ui/gsap-counter";

const planKeys = [
  "starter",
  "professional",
  "enterprise"
] as const;

export function PricingSection() {
  const t = useTranslations("Pricing");
  const [isAnnual, setIsAnnual] = useState(false);
  const toggleRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!bgRef.current) return;
    gsap.to(bgRef.current, {
      x: isAnnual ? "100%" : "0%",
      duration: 0.4,
      ease: "expo.out",
    });
  }, [isAnnual]);

  // Magnetic toggle effect
  useGSAP(() => {
    const toggle = toggleRef.current;
    if (!toggle) return;

    const onMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = toggle.getBoundingClientRect();
      const x = e.clientX - left - width / 2;
      const y = e.clientY - top - height / 2;
      
      gsap.to(toggle, {
        x: x * 0.2,
        y: y * 0.2,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const onMouseLeave = () => {
      gsap.to(toggle, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.5)",
        overwrite: "auto",
      });
    };

    toggle.addEventListener("mousemove", onMouseMove);
    toggle.addEventListener("mouseleave", onMouseLeave);

    return () => {
      toggle.removeEventListener("mousemove", onMouseMove);
      toggle.removeEventListener("mouseleave", onMouseLeave);
    };
  }, { scope: toggleRef });

  const currency = t("currency");

  return (
    <section className="w-full py-24 bg-zinc-950 border-t border-zinc-900 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
              {t("title")}
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
              {t("subtitle")}
            </p>

            {/* GSAP Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-bold transition-colors duration-500 ${!isAnnual ? 'text-white' : 'text-zinc-500'}`}>
                {t("monthly")}
              </span>
              <div 
                ref={toggleRef}
                onClick={() => setIsAnnual(!isAnnual)}
                className="relative w-16 h-8 bg-zinc-900 border border-zinc-800 rounded-full p-1 cursor-pointer transition-colors hover:border-zinc-700"
              >
                <div 
                  ref={bgRef}
                  className="absolute top-1 left-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-lg"
                />
              </div>
              <span className={`text-sm font-bold transition-colors duration-500 ${isAnnual ? 'text-white' : 'text-zinc-500'}`}>
                {t("annual")} <span className="text-emerald-500 ml-1 text-xs font-black">{t("save")}</span>
              </span>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {planKeys.map((key, index) => {
            const isPopular = key === "professional";
            const monthlyPrice = parseInt(t(`plans.${key}.priceMonthly`));
            const annualPrice = parseInt(t(`plans.${key}.priceAnnual`));
            
            const features = t.raw(`plans.${key}.features`) as string[];

            return (
              <ScrollReveal key={index} delay={index * 0.1} direction="up" distance={40}>
                <div className={`relative p-8 rounded-3xl border transition-all duration-500 hover:scale-[1.02] flex flex-col h-full ${isPopular ? 'border-white/20 bg-white' : 'border-zinc-800 bg-zinc-900/50'}`}>
                  {isPopular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-xl">
                      {t("popular")}
                    </div>
                  )}
                  
                  <div className="mb-8">
                    <h3 className={`text-xl font-bold mb-2 ${isPopular ? 'text-zinc-900' : 'text-white'}`}>
                      {t(`plans.${key}.name`)}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      {key === "enterprise" ? (
                        <span className={`text-4xl font-black ${isPopular ? 'text-zinc-900' : 'text-white'}`}>
                          {t("custom")}
                        </span>
                      ) : (
                        <>
                          <GsapCounter
                            className={`text-4xl font-black ${isPopular ? 'text-zinc-900' : 'text-white'}`}
                            value={isAnnual ? annualPrice : monthlyPrice}
                            prefix={currency}
                            duration={0.8}
                          />
                          <span className={isPopular ? 'text-zinc-500' : 'text-zinc-400'}>
                            {t("perMonth")}
                          </span>
                        </>
                      )}
                    </div>
                    <p className={`mt-4 text-sm leading-relaxed ${isPopular ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {t(`plans.${key}.description`)}
                    </p>
                  </div>

                  <div className="flex-1 space-y-4 mb-8">
                    {features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className={`w-4 h-4 shrink-0 ${isPopular ? 'text-zinc-900' : 'text-emerald-500'}`} />
                        <span className={`text-sm font-medium ${isPopular ? 'text-zinc-700' : 'text-zinc-300'}`}>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    size="lg" 
                    className={`w-full text-sm font-bold rounded-xl transition-all duration-300 active:scale-95 ${isPopular ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'}`}
                  >
                    {t(`plans.${key}.cta`)}
                  </Button>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
