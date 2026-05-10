"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

interface GlassGlowProps {
  className?: string;
  size?: number;
  color?: string;
  opacity?: number;
}

/**
 * GlassGlow
 * 
 * A refined spotlight effect that follows the cursor.
 * Should be placed inside a relative container with overflow-hidden.
 */
export const GlassGlow = ({
  className,
  size = 400,
  color = "rgba(255, 255, 255, 0.15)",
  opacity = 0,
}: GlassGlowProps) => {
  const glowRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const glow = glowRef.current;
    if (!glow) return;

    const parent = glow.parentElement;
    if (!parent) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Initialize quickTo setters for high-performance updates
      const xTo = gsap.quickTo(glow, "x", { duration: 0.6, ease: "power2.out" });
      const yTo = gsap.quickTo(glow, "y", { duration: 0.6, ease: "power2.out" });
      const opacityTo = gsap.quickTo(glow, "opacity", { duration: 0.8, ease: "power2.out" });

      const onMouseMove = (e: MouseEvent) => {
        const rect = parent.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        xTo(x);
        yTo(y);
        opacityTo(1);
      };

      const onMouseLeave = () => {
        opacityTo(0);
      };

      parent.addEventListener("mousemove", onMouseMove);
      parent.addEventListener("mouseleave", onMouseLeave);

      return () => {
        parent.removeEventListener("mousemove", onMouseMove);
        parent.removeEventListener("mouseleave", onMouseLeave);
      };
    });

    return () => mm.revert();
  }, { scope: glowRef });

  return (
    <div
      ref={glowRef}
      className={cn(
        "absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-0 mix-blend-soft-light",
        className
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity: opacity,
      }}
    />
  );
};
