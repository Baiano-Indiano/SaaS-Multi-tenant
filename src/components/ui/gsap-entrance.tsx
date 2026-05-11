"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface GsapEntranceProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  y?: number;
  x?: number;
  scale?: number;
  blur?: number;
  stagger?: number;
  type?: "fade" | "slide" | "zoom" | "apple";
  className?: string;
}

/**
 * GsapEntrance
 * 
 * A premium wrapper for entrance animations inspired by Apple's design language.
 * Uses GSAP for high-performance, refined motion with custom easing.
 */
export const GsapEntrance = ({
  children,
  duration = 1.2,
  delay = 0,
  y = 40,
  x = 0,
  scale = 0.98,
  blur = 20,
  stagger = 0.1,
  type = "apple",
  className = "",
}: GsapEntranceProps) => {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const elements = container.current?.children;
      if (!elements || elements.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        // Instantly reveal without animation
        gsap.set(elements, { opacity: 1, y: 0, x: 0, scale: 1, filter: "none" });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Reset initial state to avoid flash of unstyled content (FOUC)
        gsap.set(elements, { 
          opacity: 0,
          y: type === "apple" || type === "slide" ? y : 0,
          x: type === "slide" ? x : 0,
          scale: type === "apple" || type === "zoom" ? scale : 1,
          filter: type === "apple" ? `blur(${blur}px)` : "none",
        });

        // Animate in
        gsap.to(elements, {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          filter: "blur(0px)",
          duration,
          delay,
          stagger,
          ease: "expo.out",
        });
      });

      return () => mm.revert();
    },
    { scope: container }
  );

  return (
    <div ref={container} className={className}>
      {children}
    </div>
  );
};
