"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

interface OrgRouteTransitionProps {
  children: React.ReactNode;
}

export function OrgRouteTransition({ children }: OrgRouteTransitionProps) {
  const pathname = usePathname();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousRankRef = React.useRef<number | null>(null);

  const resolveRank = React.useCallback((path: string) => {
    const segments = path.split("/").filter(Boolean);
    const route = segments[2] ?? "dashboard";
    const leaf = segments[3] ?? "";

    if (route === "dashboard") return 10;
    if (route === "projects") return 20;
    if (route === "settings") {
      const settingsOrder: Record<string, number> = {
        "": 0,
        members: 1,
        roles: 2,
        billing: 3,
        activity: 4,
        domains: 5,
      };
      return 100 + (settingsOrder[leaf] ?? 0);
    }

    return 50;
  }, []);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const mm = gsap.matchMedia();
      const currentRank = resolveRank(pathname);
      const previousRank = previousRankRef.current;
      const direction = previousRank === null ? 0 : currentRank >= previousRank ? 1 : -1;
      previousRankRef.current = currentRank;

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          containerRef.current,
          {
            autoAlpha: 0,
            x: direction === 0 ? 0 : direction * 18,
            y: 14,
          },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 0.34,
            ease: "power2.out",
            clearProps: "transform,opacity",
          }
        );
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [pathname, resolveRank], revertOnUpdate: true }
  );

  return <div ref={containerRef}>{children}</div>;
}
