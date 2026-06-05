"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ScrollDownIndicator() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Entry animation — fade in from below
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2, delay: 1.5, ease: "expo.out" }
      );

      // Chevron arrows staggered bounce
      gsap.to(".scroll-chevron", {
        y: 6,
        opacity: 0.3,
        duration: 0.8,
        stagger: 0.15,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Outer ring pulse
      gsap.to(".scroll-ring", {
        scale: 1.15,
        opacity: 0.15,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Dot gentle glow
      gsap.to(".scroll-dot", {
        boxShadow: "0 0 20px 4px rgba(255,255,255,0.15)",
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Fade out as user scrolls down
      ScrollTrigger.create({
        trigger: document.body,
        start: "top top",
        end: "+=600",
        scrub: true,
        onUpdate: (self) => {
          if (containerRef.current) {
            gsap.set(containerRef.current, {
              opacity: 1 - self.progress,
            });
          }
        },
      });
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(containerRef.current, { opacity: 1 });
    });
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 opacity-0 pointer-events-none"
    >
      {/* Label */}
      <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-zinc-500">
        Scroll
      </span>

      {/* Container circle with chevrons */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulse ring */}
        <div className="scroll-ring absolute w-12 h-12 rounded-full border border-zinc-700/40" />

        {/* Inner circle */}
        <div className="w-10 h-10 rounded-full border border-zinc-700/60 bg-zinc-900/30 backdrop-blur-sm flex flex-col items-center justify-center gap-0.5">
          {/* Double chevron arrow */}
          <svg
            className="scroll-chevron w-3.5 h-3.5 text-zinc-400"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 4L7 8L11 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 7L7 11L11 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
            />
          </svg>
        </div>

        {/* Center dot */}
        <div className="scroll-dot absolute bottom-[-8px] w-1 h-1 rounded-full bg-zinc-500" />
      </div>

      {/* Bottom line */}
      <div className="w-px h-8 bg-gradient-to-b from-zinc-700/50 to-transparent" />
    </div>
  );
}
