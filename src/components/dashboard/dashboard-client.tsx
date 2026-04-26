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
  const spotlightRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Entry Animations
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    tl.from(".dashboard-header", {
      autoAlpha: 0,
      y: -40,
      filter: "blur(10px)",
      duration: 1.2,
    });

    tl.from(
      ".dashboard-section",
      {
        autoAlpha: 0,
        y: 60,
        scale: 0.95,
        filter: "blur(10px)",
        duration: 1.4,
        stagger: 0.15,
      },
      "-=0.8"
    );

    // Spotlight Tracking
    const onMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current || !containerRef.current) return;
      const { left, top } = containerRef.current.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;

      gsap.to(spotlightRef.current, {
        x: x - 400, // Offset to center the 800px glow
        y: y - 400,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
      });
    };

    const onMouseLeave = () => {
      if (!spotlightRef.current) return;
      gsap.to(spotlightRef.current, {
        opacity: 0,
        duration: 0.8,
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    containerRef.current.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, { scope: containerRef });

  return (
    <div 
      ref={containerRef} 
      className="relative flex flex-col gap-6 max-w-6xl mx-auto px-4 md:px-0 py-6 overflow-hidden"
    >
      {/* Dynamic Spotlight Glow */}
      <div 
        ref={spotlightRef}
        className="absolute top-0 left-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none opacity-0 z-0"
        style={{ willChange: "transform, opacity" }}
      />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
