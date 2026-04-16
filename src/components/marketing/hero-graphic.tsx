"use client";

import { useLayoutEffect, useRef } from "react";
import { animate, stagger, remove } from "animejs";

export function HeroGraphic() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const targets = containerRef.current.querySelectorAll(".stagger-item");
    const pulseTargets = containerRef.current.querySelectorAll(".pulse-item");

    // Stagger reveal for sidebar + content blocks
    animate(targets, {
      opacity: [0, 1],
      translateY: [20, 0],
      ease: 'outExpo',
      duration: 1000,
      delay: stagger(150),
    });

    // Pulse items fade in after a delay
    animate(pulseTargets, {
      opacity: [0, 1],
      scale: [0.95, 1],
      ease: 'outExpo',
      duration: 800,
      delay: stagger(100, { start: 400 }),
    });

    return () => {
      remove(targets);
      remove(pulseTargets);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video md:aspect-[21/9] bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center p-8"
    >
      {/* Abstract Dashboard representation for the graphic */}
      <div className="w-full h-full flex gap-4">
        {/* Sidebar abstraction */}
        <div className="stagger-item hidden md:flex w-48 h-full bg-zinc-900 rounded border border-zinc-800 flex-col gap-3 p-4">
          <div className="w-full h-8 bg-zinc-800 rounded pulse-item opacity-0"></div>
          <div className="w-3/4 h-4 bg-zinc-800 rounded mt-4 pulse-item opacity-0"></div>
          <div className="w-1/2 h-4 bg-zinc-800 rounded pulse-item opacity-0"></div>
          <div className="w-5/6 h-4 bg-zinc-800 rounded pulse-item opacity-0"></div>
        </div>
        
        {/* Main Content abstraction */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Header abstraction */}
          <div className="stagger-item w-full h-12 bg-zinc-900 rounded border border-zinc-800 flex items-center px-4 justify-between">
             <div className="w-32 h-4 bg-zinc-800 rounded pulse-item opacity-0"></div>
             <div className="w-8 h-8 bg-zinc-800 rounded-full pulse-item opacity-0"></div>
          </div>
          
          {/* Grid abstraction */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="stagger-item bg-zinc-900 rounded border border-zinc-800 p-4 flex flex-col gap-2">
               <div className="w-1/3 h-4 bg-zinc-800 rounded pulse-item opacity-0"></div>
               <div className="w-full flex-1 bg-zinc-800/50 rounded mt-2 pulse-item opacity-0"></div>
            </div>
            <div className="stagger-item bg-zinc-900 rounded border border-zinc-800 p-4 flex flex-col gap-2">
               <div className="w-1/3 h-4 bg-zinc-800 rounded pulse-item opacity-0"></div>
               <div className="w-full flex-1 bg-zinc-800/50 rounded mt-2 pulse-item opacity-0"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/80 via-transparent to-zinc-900/20 pointer-events-none"></div>
    </div>
  );
}
