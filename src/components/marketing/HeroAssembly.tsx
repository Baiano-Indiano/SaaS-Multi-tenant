"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { BarChart3, Activity, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

export function HeroAssembly() {
  const t = useTranslations("Hero");
  const containerRef = useRef<HTMLDivElement>(null);
  const assemblyRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current || !assemblyRef.current) return;

    const mm = gsap.matchMedia(containerRef);

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=150%", // How long the animation lasts in scroll distance
          scrub: 1.2,    // Smooth scrubbing
          pin: true,     // Pin the section while animating
          anticipatePin: 1,
        }
      });

      // Fade out instructional text
      timeline.to(".scroll-hint", {
        opacity: 0,
        y: 20,
        ease: "power2.in"
      }, 0);

      // Animate the plates from scattered to assembled
      // Plate 1: Sidebar
      timeline.fromTo(".plate-sidebar", 
        { x: -300, y: 150, opacity: 0, rotateY: 30, rotateX: 5, skewX: 10, scale: 0.8 },
        { x: 0, y: 0, opacity: 1, rotateY: 0, rotateX: 0, skewX: 0, scale: 1, ease: "power2.inOut" },
        0
      );

      // Plate 2: Main Content / Header
      timeline.fromTo(".plate-header", 
        { y: -200, opacity: 0, rotateX: -15, scale: 1.1 },
        { y: 0, opacity: 1, rotateX: 0, scale: 1, ease: "power2.inOut" },
        0.1
      );

      // Plate 3: Analytics Card
      timeline.fromTo(".plate-analytics", 
        { x: 400, y: 300, opacity: 0, rotateZ: 5, rotateY: -20, scale: 0.9 },
        { x: 0, y: 0, opacity: 1, rotateZ: 0, rotateY: 0, scale: 1, ease: "power2.inOut" },
        0.2
      );

      // Plate 4: Activity Log
      timeline.fromTo(".plate-activity", 
        { x: 250, y: -250, opacity: 0, rotateY: -25, skewY: 5, scale: 0.85 },
        { x: 0, y: 0, opacity: 1, rotateY: 0, skewY: 0, scale: 1, ease: "power2.inOut" },
        0.15
      );

      // Subtle atmospheric glow movement
      gsap.to(".assembly-bg-glow", {
        scale: 1.2,
        opacity: 0.6,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=150%",
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
        }
      });

      // Fade out instructional text
      timeline.to(".scroll-hint", {
        opacity: 0,
        ease: "power2.in"
      }, 0);

      // Simple opacity fades
      timeline.fromTo(".plate-sidebar", { opacity: 0 }, { opacity: 1, ease: "power1.inOut" }, 0);
      timeline.fromTo(".plate-header", { opacity: 0 }, { opacity: 1, ease: "power1.inOut" }, 0.1);
      timeline.fromTo(".plate-analytics", { opacity: 0 }, { opacity: 1, ease: "power1.inOut" }, 0.2);
      timeline.fromTo(".plate-activity", { opacity: 0 }, { opacity: 1, ease: "power1.inOut" }, 0.15);
      
      // Stop the glow animation
      gsap.set(".assembly-bg-glow", { opacity: 0 });
    });

  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef} 
      className="relative w-full h-screen bg-zinc-950 overflow-hidden flex items-center justify-center"
    >
      {/* Background Atmosphere (CSS Only) */}
      <div className="assembly-bg-glow absolute w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(24,24,27,0.5),rgba(9,9,11,1))] z-0" />

      {/* Assembly Container */}
      <div 
        ref={assemblyRef}
        className="relative w-full max-w-6xl px-4 md:px-8 z-10 perspective-2000"
      >
        <div className="relative w-full grid grid-cols-4 md:grid-cols-12 gap-3 md:gap-4 h-[60vh] md:h-auto md:aspect-video">
          
          {/* PLATE: SIDEBAR (Hidden on mobile) */}
          <div className="plate-sidebar hidden md:flex col-span-3 row-span-6 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex-col gap-6 shadow-2xl overflow-hidden group">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                   <Zap className="w-4 h-4 text-primary" />
                </div>
                <div className="h-4 w-24 bg-zinc-800 rounded-full" />
             </div>
             <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-zinc-800/50" />
                    <div className={cn("h-2 bg-zinc-800/50 rounded-full", i % 2 === 0 ? "w-16" : "w-20")} />
                  </div>
                ))}
             </div>
             <div className="mt-auto p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="h-2 w-12 bg-primary/30 rounded-full mb-2" />
                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                   <div className="w-2/3 h-full bg-primary" />
                </div>
             </div>
          </div>

          {/* PLATE: HEADER */}
          <div className="plate-header col-span-4 md:col-span-9 row-span-1 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 flex items-center justify-between shadow-xl">
             <div className="flex items-center gap-4">
                <div className="h-3 md:h-5 w-24 md:w-40 bg-zinc-800 rounded-full" />
                <div className="h-3 md:h-5 w-12 md:w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full" />
             </div>
             <div className="flex items-center gap-2 md:gap-3">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-zinc-800" />
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-zinc-800" />
             </div>
          </div>

          {/* PLATE: ANALYTICS */}
          <div className="plate-analytics col-span-4 md:col-span-6 row-span-4 md:row-span-5 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col">
             <div className="flex justify-between items-start mb-6 md:mb-8">
                <div>
                  <h4 className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">
                    {t("totalRevenue")}
                  </h4>
                  <div className="text-xl md:text-3xl font-bold text-zinc-100">{t("revenueAmount")}</div>
                </div>
                <div className="p-1.5 md:p-2 bg-emerald-500/10 rounded-lg">
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                </div>
             </div>
             <div className="flex-1 flex items-end gap-1.5 md:gap-2">
                {[40, 70, 45, 90, 65, 80, 50, 100, 75, 85].map((h, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "flex-1 bg-primary/20 border-t-2 border-primary/50 rounded-t",
                      i > 5 && "hidden sm:block" // Hide some bars on very small screens
                    )}
                    style={{ height: `${h}%` }}
                  />
                ))}
             </div>
          </div>

          {/* PLATE: ACTIVITY (Visible on large screens) */}
          <div className="plate-activity hidden lg:flex col-span-3 row-span-5 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex-col">
             <div className="flex items-center justify-between mb-6">
                <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  {t("activity")}
                </h4>
                <Activity className="w-4 h-4 text-zinc-600" />
             </div>
             <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0" />
                    <div className="space-y-2 pt-1">
                      <div className="h-2 w-24 bg-zinc-800 rounded-full" />
                      <div className="h-1.5 w-16 bg-zinc-800/50 rounded-full" />
                    </div>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>

      {/* Instructional text - only visible at the start */}
      <div className="scroll-hint absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-500 animate-bounce pointer-events-none">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
          {t("scrollToAssemble")}
        </span>
        <div className="w-px h-8 bg-gradient-to-b from-zinc-800 to-transparent" />
      </div>
    </section>
  );
}
