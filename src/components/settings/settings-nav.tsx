"use client";

import * as React from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

interface SettingsNavItem {
  title: string;
  href: string;
}

interface SettingsNavProps {
  items: SettingsNavItem[];
}

export function SettingsNav({ items }: SettingsNavProps) {
  const pathname = usePathname();
  const navRef = React.useRef<HTMLDivElement>(null);
  const indicatorRef = React.useRef<HTMLDivElement>(null);
  const linkRefs = React.useRef<Record<string, HTMLAnchorElement | null>>({});

  const isActive = React.useCallback(
    (href: string) => {
      // Exact match for the current link
      if (pathname === href) return true;
      
      // If it's a sub-page, check if the pathname starts with the href followed by a slash
      // But only if href is not just the base settings path
      if (!href.endsWith("/settings") && pathname.startsWith(`${href}/`)) return true;
      
      return false;
    },
    [pathname]
  );

  useGSAP(
    () => {
      if (!navRef.current || !indicatorRef.current) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".settings-nav-item", {
          autoAlpha: 0,
          x: -10,
          duration: 0.36,
          stagger: 0.04,
          ease: "power2.out",
        });
      });

      return () => mm.revert();
    },
    { scope: navRef }
  );

  useGSAP(
    () => {
      if (!indicatorRef.current) return;

      const activeItem = items.find((item) => isActive(item.href));
      const activeLink = activeItem ? Reflect.get(linkRefs.current, activeItem.href) : null;
      
      if (!activeLink) {
        gsap.to(indicatorRef.current, { autoAlpha: 0, duration: 0.2 });
        return;
      }

      gsap.to(indicatorRef.current, {
        y: activeLink.offsetTop,
        x: activeLink.offsetLeft,
        width: activeLink.offsetWidth,
        height: activeLink.offsetHeight,
        autoAlpha: 1,
        duration: 0.3,
        ease: "power3.out",
      });
    },
    { dependencies: [pathname, items, isActive], scope: navRef }
  );

  return (
    <nav ref={navRef} className="relative flex flex-row lg:flex-col gap-2 w-fit">
      <div
        ref={indicatorRef}
        aria-hidden
        className="absolute rounded-lg bg-zinc-800/40 border border-zinc-700/30 opacity-0 z-0 shadow-sm"
      />
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          ref={(el) => {
            Reflect.set(linkRefs.current, item.href, el);
          }}
          className={cn(
            "settings-nav-item relative z-10 justify-start rounded-md px-4 py-2 text-sm font-medium transition-colors",
            isActive(item.href)
              ? "text-zinc-50 font-semibold bg-zinc-800/10"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/5 transition-colors duration-200"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}

