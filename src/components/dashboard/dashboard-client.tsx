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

    try {
      const mm = gsap.matchMedia(containerRef);

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const header = containerRef.current?.querySelector(".dashboard-header");
        const sections = containerRef.current?.querySelectorAll(".dashboard-section");

        const tl = gsap.timeline({
          defaults: { ease: "expo.out" },
          onComplete: () => {
            containerRef.current?.classList.add("animations-complete");
          }
        });

        if (header) {
          tl.from(header, {
            opacity: 0,
            y: -20,
            filter: "blur(8px)",
            duration: 0.8,
          });
        }

        if (sections && sections.length > 0) {
          tl.from(
            sections,
            {
              opacity: 0,
              y: 30,
              scale: 0.98,
              filter: "blur(8px)",
              duration: 1,
              stagger: 0.1,
            },
            header ? "-=0.4" : 0
          );
        }
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        const targets = containerRef.current?.querySelectorAll(".dashboard-header, .dashboard-section");
        if (targets && targets.length > 0) {
          gsap.from(targets, {
            opacity: 0,
            duration: 0.6,
            stagger: 0.05,
            ease: "power2.out"
          });
        }
      });

      return () => mm.revert();
    } catch (error) {
      console.warn("Dashboard animations skipped:", error);
    }
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col gap-6 max-w-[1400px] mx-auto px-4 md:px-8 py-6 overflow-hidden [&_.dashboard-header]:opacity-100 [&_.dashboard-section]:opacity-100"
    >


      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
