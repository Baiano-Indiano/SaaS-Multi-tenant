"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollReveal } from "./scroll-reveal";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 0,
    description: "Perfect for testing and early-stage prototypes.",
    features: ["Up to 5 members", "2 Active Projects", "Shared Infrastructure", "Community Support"],
    cta: "Start for free",
    popular: false,
  },
  {
    name: "Professional",
    monthlyPrice: 49,
    description: "Scale your business with advanced organization tools.",
    features: ["Up to 50 members", "Unlimited Projects", "Custom Roles (RBAC)", "Priority Support", "Basic Analytics"],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    description: "Maximum security and compliance for large teams.",
    features: ["Unlimited members", "Dedicated Schema", "Audit Logging", "SLA Guarantee", "24/7 Support", "API & Webhooks"],
    cta: "Contact Sales",
    popular: false,
  },
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const toggleRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!bgRef.current) return;
    gsap.to(bgRef.current, {
      x: isAnnual ? "100%" : "0%",
      duration: 0.3,
      ease: "power2.inOut",
    });
  }, [isAnnual]);

  return (
    <section className="w-full py-24 bg-zinc-950 border-t border-zinc-900">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
              Transparent Pricing for Every Scale
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
              Choose the plan that best fits your organization&apos;s needs.
            </p>

            {/* GSAP Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-bold transition-colors ${!isAnnual ? 'text-white' : 'text-zinc-500'}`}>Monthly</span>
              <div 
                ref={toggleRef}
                onClick={() => setIsAnnual(!isAnnual)}
                className="relative w-16 h-8 bg-zinc-900 border border-zinc-800 rounded-full p-1 cursor-pointer"
              >
                <div 
                  ref={bgRef}
                  className="absolute top-1 left-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full"
                />
              </div>
              <span className={`text-sm font-bold transition-colors ${isAnnual ? 'text-white' : 'text-zinc-500'}`}>
                Annual <span className="text-emerald-500 ml-1 text-xs font-black">SAVE 20%</span>
              </span>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const price = plan.monthlyPrice === null 
              ? "Custom" 
              : isAnnual 
                ? `$${Math.floor(plan.monthlyPrice * 0.8)}` 
                : `$${plan.monthlyPrice}`;

            return (
              <ScrollReveal key={index} delay={index * 0.1} direction="up" distance={40}>
                <div className={`relative p-8 rounded-3xl border ${plan.popular ? 'border-zinc-200 bg-white' : 'border-zinc-800 bg-zinc-900/50'} flex flex-col h-full transition-transform duration-300 hover:-translate-y-2`}>
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-200 text-zinc-950 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="mb-8">
                    <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-zinc-900' : 'text-white'}`}>{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-black ${plan.popular ? 'text-zinc-900' : 'text-white'}`}>{price}</span>
                      {plan.monthlyPrice !== null && (
                        <span className="text-zinc-500 font-medium">/month</span>
                      )}
                    </div>
                    <p className={`mt-4 text-sm ${plan.popular ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex-1 space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className={`w-4 h-4 ${plan.popular ? 'text-zinc-900' : 'text-emerald-500'}`} />
                        <span className={`text-sm font-medium ${plan.popular ? 'text-zinc-700' : 'text-zinc-300'}`}>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    size="lg" 
                    className={`w-full text-base font-bold rounded-xl ${plan.popular ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'}`}
                  >
                    {plan.cta}
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
