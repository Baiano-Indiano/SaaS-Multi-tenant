"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
      if (pathname === href) return true;
      // If this is the "General" tab (base settings path), only highlight on exact match
      // to avoid overlapping with other specific tabs like /security, /activity, etc.
      if (href.endsWith("/settings")) return false;
      return pathname.startsWith(`${href}/`);
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
      const activeLink = activeItem ? linkRefs.current[activeItem.href] : null;
      if (!activeLink) return;

      gsap.to(indicatorRef.current, {
        y: activeLink.offsetTop,
        height: activeLink.offsetHeight,
        autoAlpha: 1,
        duration: 0.28,
        ease: "power2.out",
      });
    },
    { dependencies: [pathname, items, isActive], scope: navRef, revertOnUpdate: true }
  );

  return (
    <nav ref={navRef} className="relative flex flex-row lg:flex-col gap-1 w-fit min-w-[140px]">
      <div
        ref={indicatorRef}
        aria-hidden
        className="absolute left-0 w-full rounded-lg bg-zinc-800/40 ring-1 ring-zinc-700/30 opacity-0"
      />
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          ref={(el) => {
            linkRefs.current[item.href] = el;
          }}
          className={cn(
            "settings-nav-item relative z-10 justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive(item.href)
              ? "text-zinc-50 font-semibold"
              : "text-zinc-400 hover:text-zinc-200 transition-colors duration-200"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}

