"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

interface GsapCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

/**
 * GsapCounter
 * 
 * Animates numbers with precision and smooth easing.
 */
export const GsapCounter = ({
  value,
  duration = 0.6, // Snappier duration for analytics
  delay = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: GsapCounterProps) => {
  const el = useRef<HTMLSpanElement>(null);
  const countRef = useRef({ val: 0 });

  useGSAP(() => {
    if (!el.current) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // 1. Numeric Animation
      gsap.to(countRef.current, {
        val: value,
        duration,
        delay,
        ease: "expo.out",
        onUpdate: () => {
          if (el.current) {
            // We use a separate span for the value to avoid blurring prefix/suffix if desired, 
            // but usually the whole widget "jumps" into place.
            const valueSpan = el.current.querySelector(".counter-value");
            if (valueSpan) {
              valueSpan.textContent = countRef.current.val.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              });
            }
          }
        },
      });

      // 2. Blur-Slide Visual Effect (Apple-style)
      gsap.fromTo(el.current, 
        { 
          y: 10, 
          filter: "blur(6px)", 
          opacity: 0 
        },
        { 
          y: 0, 
          filter: "blur(0px)", 
          opacity: 1,
          duration: duration * 1.2,
          delay,
          ease: "power4.out"
        }
      );
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      countRef.current.val = value;
      if (el.current) {
        const valueSpan = el.current.querySelector(".counter-value");
        if (valueSpan) {
          valueSpan.textContent = value.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
        }
        gsap.set(el.current, { y: 0, filter: "blur(0px)", opacity: 1 });
      }
    });

    return () => mm.revert();
  }, { dependencies: [value], scope: el });

  return (
    <span ref={el} className={cn("inline-flex items-baseline", className)}>
      {prefix && <span className="opacity-70 mr-0.5">{prefix}</span>}
      <span className="counter-value">
        {value.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
      </span>
      {suffix && <span className="opacity-70 ml-0.5">{suffix}</span>}
    </span>
  );
};
