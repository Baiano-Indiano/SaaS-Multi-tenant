"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion, Variants } from "framer-motion";
import gsap from "gsap";

export function AnimatedBackground() {
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion || !gridRef.current) return;

    // Use GSAP to animate the grid position infinitely and smoothly
    const tween = gsap.to(gridRef.current, {
      backgroundPosition: "40px 40px",
      duration: 20,
      ease: "none",
      repeat: -1,
    });

    return () => {
      tween.kill();
    };
  }, [shouldReduceMotion]);

  // Framer Motion keyframes for organic drifting lights
  const driftVariants1: Variants = {
    animate: {
      x: [0, 80, -60, 0],
      y: [0, -100, 70, 0],
      scale: [1, 1.15, 0.9, 1],
      opacity: [0.08, 0.14, 0.06, 0.08],
      transition: {
        duration: 25,
        ease: "easeInOut" as const,
        repeat: Infinity,
      },
    },
  };

  const driftVariants2: Variants = {
    animate: {
      x: [0, -90, 50, 0],
      y: [0, 80, -90, 0],
      scale: [1.1, 0.95, 1.15, 1.1],
      opacity: [0.06, 0.12, 0.08, 0.06],
      transition: {
        duration: 30,
        ease: "easeInOut" as const,
        repeat: Infinity,
      },
    },
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* Dynamic Grid Pattern animated with GSAP */}
      <div
        ref={gridRef}
        className="absolute inset-0 w-full h-full opacity-65 bg-grid-pattern"
      />

      {/* Atmospheric light blobs animated with Framer Motion */}
      {!shouldReduceMotion ? (
        <>
          {/* Blob 1: Top Left - Soft Emerald Glow */}
          <motion.div
            variants={driftVariants1}
            animate="animate"
            className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]"
          />

          {/* Blob 2: Bottom Right - Soft Slate/Zinc Glow */}
          <motion.div
            variants={driftVariants2}
            animate="animate"
            className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-zinc-700/10 blur-[130px]"
          />
        </>
      ) : (
        <>
          {/* Static fallbacks for users with reduced motion settings */}
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-zinc-700/5 blur-[130px]" />
        </>
      )}

      {/* Center ambient glow matching the main branding color */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-zinc-900/10 blur-[150px]" />
    </div>
  );
}
