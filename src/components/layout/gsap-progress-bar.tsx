"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import gsap from "gsap";

export function GSAPProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const barRef = useRef<HTMLDivElement>(null);
  const handleRouteStart = () => {
    if (!barRef.current) return;
    
    gsap.killTweensOf(barRef.current);
    
    // Initial jump and slow crawl
    gsap.set(barRef.current, { width: "0%", opacity: 1, display: "block" });
    
    gsap.to(barRef.current, {
      width: "40%",
      duration: 0.4,
      ease: "power2.out"
    });

    gsap.to(barRef.current, {
      width: "90%",
      duration: 10,
      ease: "none",
      delay: 0.4
    });
  };

  const handleRouteComplete = () => {
    if (!barRef.current) return;

    gsap.killTweensOf(barRef.current);
    
    gsap.to(barRef.current, {
      width: "100%",
      duration: 0.3,
      ease: "power2.out",
      onComplete: () => {
        gsap.to(barRef.current, {
          opacity: 0,
          duration: 0.4,
          delay: 0.1,
          onComplete: () => {
            gsap.set(barRef.current, { width: "0%", display: "none" });
          }
        });
      }
    });
  };

  // Trigger when route changes
  useEffect(() => {
    handleRouteStart();
    
    // In Next.js App Router, the page transition is "complete" 
    // when the new page component mounts and this effect runs again.
    const timeout = setTimeout(() => {
      handleRouteComplete();
    }, 400);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      style={{ height: '3px' }}
    >
      <div
        ref={barRef}
        className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
        style={{ width: '0%', display: 'none' }}
      />
    </div>
  );
}
