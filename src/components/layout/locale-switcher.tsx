"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname, routing } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Languages, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useGSAP(() => {
    if (isOpen) {
      gsap.fromTo(listRef.current,
        { opacity: 0, y: -10, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "power2.out" }
      );
      
      gsap.fromTo(".locale-item",
        { opacity: 0, x: -5 },
        { opacity: 1, x: 0, duration: 0.2, stagger: 0.05, delay: 0.1 }
      );
    }
  }, [isOpen]);

  function handleLocaleChange(newLocale: string) {
    if (newLocale === locale) return;
    
    setIsOpen(false);
    
    // Using the wrapped router from next-intl/navigation
    router.replace(
    // @ts-expect-error: next-intl router types can be strict with dynamic params
      { pathname, params },
      { locale: newLocale }
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors text-sm font-medium text-zinc-300 group"
      >
        <Languages className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        <span className="uppercase">{locale}</span>
        <ChevronDown className={cn("w-3 h-3 text-zinc-500 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <ul
            ref={listRef}
            className="absolute bottom-full mb-2 right-0 w-32 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl z-50 p-1"
          >
            {routing.locales.map((cur) => (
              <li key={cur}>
                <button
                  onClick={() => handleLocaleChange(cur)}
                  className={cn(
                    "locale-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                    locale === cur 
                      ? "bg-zinc-900 text-zinc-100" 
                      : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
                  )}
                >
                  <span className="capitalize">{cur === 'en' ? 'English' : 'Português'}</span>
                  {locale === cur && <Check className="w-3 h-3" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
