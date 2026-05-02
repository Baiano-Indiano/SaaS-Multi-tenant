"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

interface MagneticCardProps {
  children: React.ReactNode;
  className?: string;
  strength?: number; // How much it tilts
  scale?: number;    // How much it grows
}

export function MagneticCard({ 
  children, 
  className, 
  strength = 15, 
  scale = 1.02 
}: MagneticCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!cardRef.current || !innerRef.current) return;

    const card = cardRef.current;
    const inner = innerRef.current;

    const onMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = card.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      
      const centerX = width / 2;
      const centerY = height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -strength;
      const rotateY = ((x - centerX) / centerX) * strength;

      gsap.to(inner, {
        rotateX,
        rotateY,
        scale,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const onMouseLeave = () => {
      gsap.to(inner, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        duration: 0.6,
        ease: "elastic.out(1, 0.3)",
        overwrite: "auto",
      });
    };

    card.addEventListener("mousemove", onMouseMove);
    card.addEventListener("mouseleave", onMouseLeave);

    return () => {
      card.removeEventListener("mousemove", onMouseMove);
      card.removeEventListener("mouseleave", onMouseLeave);
    };
  }, { scope: cardRef });

  return (
    <div 
      ref={cardRef} 
      className={cn("perspective-2000", className)}
    >
      <div 
        ref={innerRef}
        className="w-full h-full transition-shadow duration-300 transform-style-3d"
      >
        {children}
      </div>
      
      <style jsx>{`
        .transform-style-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
}
