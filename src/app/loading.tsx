"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function GlobalLoading() {
  const logoRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ repeat: -1 });

    // Pulsing logo animation
    tl.to(logoRef.current, {
      scale: 1.1,
      opacity: 0.8,
      duration: 1.5,
      ease: "sine.inOut",
      yoyo: true,
    });

    // Rotating ring
    gsap.to(ringRef.current, {
      rotation: 360,
      duration: 3,
      repeat: -1,
      ease: "none",
    });

    // Subtle text fade
    gsap.to(textRef.current, {
      opacity: 0.5,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-zinc-950 z-[10000]">
      <div className="relative flex flex-col items-center">
        {/* Orbital Ring */}
        <div 
          ref={ringRef}
          className="absolute w-24 h-24 rounded-full border-2 border-emerald-500/20 border-t-emerald-500/80"
        />
        
        {/* Central Logo Container */}
        <div 
          ref={logoRef}
          className="relative w-16 h-16 flex items-center justify-center bg-white rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.15)] overflow-hidden"
        >
          <span className="text-3xl font-black text-black select-none">G</span>
          {/* Internal Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
        </div>

        {/* Loading Text */}
        <p 
          ref={textRef}
          className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80 antialiased"
        >
          Iniciando Sistema
        </p>
        
        {/* Background Atmosphere */}
        <div className="absolute -z-10 w-[300px] h-[300px] bg-emerald-500/5 blur-[100px] rounded-full" />
      </div>
    </div>
  );
}

