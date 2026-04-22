"use client";

import * as React from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

interface DashboardClientProps {
  children: React.ReactNode;
}

export function DashboardClient({ children }: DashboardClientProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".dashboard-header", {
        autoAlpha: 0,
        y: -20,
        duration: 0.9,
      });

      tl.from(
        ".dashboard-section",
        {
          autoAlpha: 0,
          y: 20,
          duration: 0.8,
          stagger: 0.12,
        },
        "-=0.5"
      );
    });

    return () => mm.revert();
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="flex flex-col gap-6 max-w-6xl mx-auto px-4 md:px-0 py-6">
      {children}
    </div>
  );
}
