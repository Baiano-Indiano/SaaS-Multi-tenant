"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { GlassGlow } from "@/components/ui/glass-glow";

interface MagneticCardProps {
  children: React.ReactNode;
  className?: string;
  strength?: number; // How much it tilts
  scale?: number;    // How much it grows
  glowColor?: string;
}

export function MagneticCard({ 
  children, 
  className, 
  strength = 15, 
  scale = 1.02,
  glowColor = "rgba(255, 255, 255, 0.12)"
}: MagneticCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!cardRef.current || !innerRef.current) return;

    const card = cardRef.current;
    const inner = innerRef.current;

    const mm = gsap.matchMedia(cardRef);

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // High-performance setters
      const rotateXTo = gsap.quickTo(inner, "rotateX", { duration: 0.5, ease: "power2.out" });
      const rotateYTo = gsap.quickTo(inner, "rotateY", { duration: 0.5, ease: "power2.out" });
      const scaleTo = gsap.quickTo(inner, "scale", { duration: 0.5, ease: "power2.out" });

      const onMouseMove = (e: MouseEvent) => {
        const { left, top, width, height } = card.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -strength;
        const rotateY = ((x - centerX) / centerX) * strength;

        rotateXTo(rotateX);
        rotateYTo(rotateY);
        scaleTo(scale);

        // Update CSS variable for the glow border
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      };

      const onMouseLeave = () => {
        gsap.to(inner, {
          rotateX: 0,
          rotateY: 0,
          scale: 1,
          duration: 0.8,
          ease: "elastic.out(1, 0.5)",
          overwrite: "auto",
        });
      };

      card.addEventListener("mousemove", onMouseMove);
      card.addEventListener("mouseleave", onMouseLeave);

      return () => {
        card.removeEventListener("mousemove", onMouseMove);
        card.removeEventListener("mouseleave", onMouseLeave);
      };
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(inner, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        clearProps: "all"
      });
    });

    return () => mm.revert();
  }, { scope: cardRef });

  return (
    <div 
      ref={cardRef} 
      className={cn(
        "perspective-2000 group relative",
        className
      )}
    >
      {/* Glow Border Effect */}
      <div 
        className="absolute inset-0 rounded-2xl z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${glowColor}, transparent 40%)`,
          padding: "1px",
        }}
      >
        <div className="w-full h-full bg-zinc-950 rounded-2xl" />
      </div>

      <div 
        ref={innerRef}
        className="w-full h-full relative overflow-hidden transition-shadow duration-300 transform-style-3d bg-zinc-900/50 border border-zinc-800/50 rounded-2xl backdrop-blur-sm"
      >
        <GlassGlow color={glowColor} size={300} />
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </div>
      
      <style jsx>{`
        .transform-style-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
}
