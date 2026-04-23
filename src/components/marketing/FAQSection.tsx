"use client";

import { useState, useRef } from "react";
import { ScrollReveal } from "./scroll-reveal";
import { ChevronDown } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const faqs = [
  {
    question: "How does the schema-per-tenant isolation work?",
    answer: "Every organization created in our platform is assigned a unique PostgreSQL schema. This ensures that data is physically isolated at the database level, preventing any possibility of cross-tenant data leakage while maintaining the performance of a single database instance.",
  },
  {
    question: "Can I customize the roles and permissions?",
    answer: "Yes, our Professional and Enterprise plans allow you to define custom roles with granular permissions (RBAC). You can control access down to specific resources and actions within each organization.",
  },
  {
    question: "How do I integrate my existing tools?",
    answer: "We provide native support for API Keys and Webhooks. You can generate keys for your developers to access our API programmatically, or register webhook URLs to receive real-time notifications about events in your organization.",
  },
  {
    question: "Is there a limit on the number of projects?",
    answer: "The Starter plan includes 2 projects, while Professional and Enterprise plans offer unlimited project creation to support your business growth.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!contentRef.current) return;
    
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
  return (
    <section className="w-full py-24 bg-zinc-950 border-t border-zinc-900">
      <div className="max-w-4xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
              Common Questions
            </h2>
            <p className="text-xl text-zinc-400">
              Everything you need to know about our enterprise platform.
            </p>
          </div>
        </ScrollReveal>

        <div className="bg-zinc-900/10 rounded-3xl border border-zinc-900 p-8 md:p-12">
          {faqs.map((faq, i) => (
            <FAQItem key={i} {...faq} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
