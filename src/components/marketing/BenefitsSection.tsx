"use client";

import { ScrollReveal } from "./scroll-reveal";
import { Shield, Zap, Globe, Cpu } from "lucide-react";

const benefits = [
  {
    title: "Enterprise Data Isolation",
    description: "Every tenant gets a dedicated PostgreSQL schema. No data leaks, guaranteed compliance.",
    icon: Shield,
    color: "text-emerald-500",
  },
  {
    title: "Global Edge Performance",
    description: "Low-latency response times across the globe with our optimized Edge proxy system.",
    icon: Globe,
    color: "text-blue-500",
  },
  {
    title: "Native Automations",
    description: "Embed complex workflows into your product to save users hours of manual work.",
    icon: Zap,
    color: "text-amber-500",
  },
  {
    title: "Developer First API",
    description: "Extensible architecture with native webhooks and programmatic access per organization.",
    icon: Cpu,
    color: "text-purple-500",
  },
];

export function BenefitsSection() {
  return (
    <section className="w-full py-24 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
              Built for Scale and Reliability
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Our infrastructure is designed to handle the most demanding enterprise workloads with zero compromises.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <ScrollReveal key={index} delay={index * 0.1} distance={20}>
              <div className="group p-8 rounded-2xl border border-zinc-900 bg-zinc-900/20 hover:border-zinc-800 hover:bg-zinc-900/40 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{benefit.title}</h3>
                <p className="text-zinc-400 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
