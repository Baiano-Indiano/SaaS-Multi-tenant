"use client";

import { MagneticCard } from "@/components/dashboard/MagneticCard";
import { GsapEntrance } from "@/components/ui/gsap-entrance";
import { Shield, Zap, Globe, Cpu } from "lucide-react";
import { useTranslations } from "next-intl";

const benefits = [
  {
    key: "isolation",
    icon: Shield,
    color: "text-emerald-500",
    glow: "rgba(16, 185, 129, 0.15)",
  },
  {
    key: "performance",
    icon: Globe,
    color: "text-blue-500",
    glow: "rgba(59, 130, 246, 0.15)",
  },
  {
    key: "automations",
    icon: Zap,
    color: "text-amber-500",
    glow: "rgba(245, 158, 11, 0.15)",
  },
  {
    key: "api",
    icon: Cpu,
    color: "text-purple-500",
    glow: "rgba(168, 85, 247, 0.15)",
  },
] as const;

export function BenefitsSection() {
  const t = useTranslations("Benefits");

  return (
    <section className="w-full py-24 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6">
        <GsapEntrance type="slide">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
              {t("title")}
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
        </GsapEntrance>

        <GsapEntrance 
          type="apple" 
          stagger={0.15} 
          delay={0.2}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {benefits.map((benefit, index) => (
            <MagneticCard 
              key={index} 
              glowColor={benefit.glow}
              className="h-full"
            >
              <div className="p-8 h-full">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">
                  {t(`items.${benefit.key}.title`)}
                </h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  {t(`items.${benefit.key}.description`)}
                </p>
              </div>
            </MagneticCard>
          ))}
        </GsapEntrance>
      </div>
    </section>
  );
}
