"use client";

import * as React from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

const data = [
  { name: "Jan", total: 120 },
  { name: "Feb", total: 210 },
  { name: "Mar", total: 150 },
  { name: "Apr", total: 340 },
  { name: "May", total: 280 },
  { name: "Jun", total: 420 },
];

export function OverviewChart() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const reduceMotionRef = React.useRef(false);
  const onBarEnterRef = React.useRef<(e: React.MouseEvent<HTMLDivElement>) => void>(() => {});
  const onBarLeaveRef = React.useRef<(e: React.MouseEvent<HTMLDivElement>) => void>(() => {});

  useGSAP((_, contextSafe) => {
    if (!containerRef.current) return;
    const safe = contextSafe ?? ((fn: (e: React.MouseEvent<HTMLDivElement>) => void) => fn);

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      reduceMotionRef.current = true;
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      reduceMotionRef.current = false;

      gsap.from(".chart-bar", {
        scaleY: 0,
        transformOrigin: "bottom center",
        duration: 1,
        stagger: 0.08,
        ease: "expo.out",
      });

      gsap.from(".chart-label", {
        autoAlpha: 0,
        y: 8,
        duration: 0.5,
        stagger: 0.08,
        delay: 0.35,
        ease: "power2.out",
      });
    });

    onBarEnterRef.current = safe((e: React.MouseEvent<HTMLDivElement>) => {
      if (reduceMotionRef.current) return;

      gsap.to(e.currentTarget, {
        backgroundColor: "rgba(113, 113, 122, 1)",
        scaleX: 1.04,
        duration: 0.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    });

    onBarLeaveRef.current = safe((e: React.MouseEvent<HTMLDivElement>) => {
      if (reduceMotionRef.current) return;

      gsap.to(e.currentTarget, {
        backgroundColor: "rgba(39, 39, 42, 1)",
        scaleX: 1,
        duration: 0.22,
        ease: "power2.out",
        overwrite: "auto",
      });
    });

    return () => {
      mm.revert();
      onBarEnterRef.current = () => {};
      onBarLeaveRef.current = () => {};
    };
  }, { scope: containerRef });

  const max = Math.max(...data.map((d) => d.total));

  return (
    <div ref={containerRef} className="w-full h-[200px] flex items-end gap-2 px-2">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
          <div
            className="chart-bar w-full bg-zinc-800 rounded-t-sm relative group cursor-pointer"
            style={{ height: `${(item.total / max) * 100}%` }}
            onMouseEnter={(e) => onBarEnterRef.current(e)}
            onMouseLeave={(e) => onBarLeaveRef.current(e)}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-zinc-300">
              ${item.total}
            </div>
          </div>
          <span className="chart-label text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">
            {item.name}
          </span>
        </div>
      ))}
    </div>
  );
}
