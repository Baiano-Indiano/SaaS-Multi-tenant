"use client";

import { useState, useRef } from "react";
import { ScrollReveal } from "./scroll-reveal";
import { ChevronDown } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTranslations } from "next-intl";

const faqKeys = [
  "schema",
  "rbac",
  "integration",
  "limits"
] as const;

function FAQItem({ question, answer }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!contentRef.current) return;
    
    const mm = gsap.matchMedia();
    
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (isOpen) {
        gsap.to(contentRef.current, {
          height: "auto",
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
        });
      } else {
        gsap.to(contentRef.current, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        });
      }
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(contentRef.current, {
        height: isOpen ? "auto" : 0,
        opacity: isOpen ? 1 : 0,
        clearProps: "all"
      });
    });

    return () => mm.revert();
  }, [isOpen]);

  return (
    <div className="border-b border-zinc-900 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
          {question}
        </span>
        <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden h-0 opacity-0"
      >
        <div className="pb-6 text-zinc-500 leading-relaxed font-medium">
          {answer}
        </div>
      </div>
    </div>
  );
}

export function FAQSection() {
  const t = useTranslations("FAQ");

  return (
    <section className="w-full py-24 bg-zinc-950 border-t border-zinc-900">
      <div className="max-w-4xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
              {t("title")}
            </h2>
            <p className="text-xl text-zinc-400">
              {t("subtitle")}
            </p>
          </div>
        </ScrollReveal>

        <div className="bg-zinc-900/10 rounded-3xl border border-zinc-900 p-8 md:p-12">
          {faqKeys.map((key, i) => (
            <FAQItem 
              key={i} 
              question={t(`items.${key}.question`)} 
              answer={t(`items.${key}.answer`)} 
              index={i} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}
