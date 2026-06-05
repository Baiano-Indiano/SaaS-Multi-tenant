"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface DataPoint {
  date: string;
  value: number;
}

interface AreaChartProps {
  data: DataPoint[];
}

export function AreaChart({ data }: AreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);

  const width = 400;
  const height = 150;
  const padding = 20;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const points = data.map((d, i) => ({
    x: data.length > 1
      ? (i / (data.length - 1)) * (width - padding * 2) + padding
      : width / 2,
    y: height - ((d.value / maxVal) * (height - padding * 2) + padding),
  }));

  const linePath = data.length > 1
    ? `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`
    : `M ${padding},${points.at(0)?.y ?? 0} L ${width - padding},${points.at(0)?.y ?? 0}`;

  const areaPath = data.length > 1
    ? `${linePath} L ${points.at(-1)?.x ?? 0},${height} L ${points.at(0)?.x ?? 0},${height} Z`
    : `M ${padding},${points.at(0)?.y ?? 0} L ${width - padding},${points.at(0)?.y ?? 0} L ${width - padding},${height} L ${padding},${height} Z`;

  useGSAP(() => {
    if (!pathRef.current || !areaRef.current || data.length === 0) return;

    const mm = gsap.matchMedia(containerRef);

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const length = pathRef.current!.getTotalLength();

      // Line drawing animation
      gsap.set(pathRef.current, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(pathRef.current, {
        strokeDashoffset: 0,
        duration: 1.5,
        ease: "power2.inOut",
        delay: 0.5,
      });

      // Area fade in
      gsap.fromTo(areaRef.current,
        { opacity: 0 },
        { opacity: 0.1, duration: 1, delay: 1, ease: "power2.out" }
      );
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      // Just fade everything in
      gsap.fromTo([pathRef.current, areaRef.current],
        { opacity: 0 },
        { opacity: 1, duration: 1, delay: 0.5, ease: "power2.out" }
      );
    });
  }, { scope: containerRef, dependencies: [data] });

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-xs font-medium uppercase tracking-widest">
        No data available
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col justify-center items-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={padding} y1={padding} x2={width-padding} y2={padding} stroke="#27272a" strokeWidth="1" strokeDasharray="4" />
        <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#27272a" strokeWidth="1" strokeDasharray="4" />
        <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#27272a" strokeWidth="1" strokeDasharray="4" />

        {/* Area */}
        <path
          ref={areaRef}
          d={areaPath}
          fill="url(#areaGradient)"
          className="pointer-events-none"
        />

        {/* Line */}
        <path
          ref={pathRef}
          d={linePath}
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            className="fill-zinc-950 stroke-emerald-500 stroke-2 hover:r-6 transition-all duration-200 cursor-pointer"
          >
            <title>{data.at(i)?.date}: {data.at(i)?.value}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}
