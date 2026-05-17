import React from "react";
import { cn } from "@/lib/utils";

interface MagneticCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

/**
 * MagneticCard (now SpotlightCard)
 *
 * Provides a premium, glassmorphic container with a subtle
 * top-down highlight on hover. No mouse tracking to ensure
 * maximum performance and interface stability.
 */
export function MagneticCard({
  children,
  className,
}: MagneticCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-sm transition-all duration-500",
        "bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-xl overflow-hidden transition-all duration-300",
        "hover:bg-zinc-900/60 hover:border-zinc-700/50 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.7)]",
        "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.05] before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
        className
      )}
    >
      {/* Grain/Noise Texture for Premium feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
