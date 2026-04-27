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
        security: 5,
        connectivity: 6,
        integrations: 7,
        sso: 8,
        status: 9,
        domains: 10,
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
      previousRankRef.current = currentRank;

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          containerRef.current,
          {
            autoAlpha: 0,
            scale: 0.98,
            y: 10,
          },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 0.36,
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
