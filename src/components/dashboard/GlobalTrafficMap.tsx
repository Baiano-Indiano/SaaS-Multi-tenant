"use client";

import { useRef, useMemo } from "react";
import { MagneticCard } from "./MagneticCard";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";

interface GlobalTrafficMapProps {
  logs: {
    id: string;
    ip: string | null;
    action: string;
    createdAt: Date;
  }[];
}

export function GlobalTrafficMap({ logs }: GlobalTrafficMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Deterministic mapping of IP to coordinates (x, y as percentage)
  const pings = useMemo(() => {
    return logs.map(log => {
      const ip = log.ip || "127.0.0.1";
      // Simple hash function for consistent coordinates
      let hash = 0;
      for (let i = 0; i < ip.length; i++) {
        hash = (hash << 5) - hash + ip.charCodeAt(i);
        hash |= 0;
      }
      
      // Map to roughly populated areas of the world
      const x = Math.abs((hash % 80) + 10); // 10% to 90%
      const y = Math.abs(((hash >> 8) % 60) + 20); // 20% to 80%
      const latency = (Math.abs(hash % 20) + 10).toFixed(1);
      
      return { id: log.id, x, y, action: log.action, latency };
    });
  }, [logs]);

  useGSAP(() => {
    const ripples = containerRef.current?.querySelectorAll(".ping-ripple");
    if (ripples) {
      gsap.fromTo(
        ripples,
        { scale: 0, opacity: 1 },
        {
          scale: 4,
          opacity: 0,
          duration: 2,
          stagger: {
            each: 0.5,
            repeat: -1,
          },
          ease: "power2.out",
        }
      );
    }
  }, { scope: containerRef, dependencies: [pings] });

  return (
    <MagneticCard className="relative h-[400px] overflow-hidden bg-zinc-950 p-0 border-zinc-800">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(24,24,27,0)_0%,rgba(9,9,11,1)_100%)] z-10" />
      
      <div className="absolute top-6 left-6 z-20">
        <h3 className="text-xl font-bold text-white tracking-tight">Global Traffic</h3>
        <p className="text-sm text-zinc-500 font-mono">LIVE_AUDIT_STREAM_v4</p>
      </div>

      <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-xs font-mono text-zinc-500 uppercase">Active Nodes</span>
          <span className="text-lg font-mono text-emerald-500">14</span>
        </div>
        <div className="h-8 w-[1px] bg-zinc-800" />
        <div className="flex flex-col items-end">
          <span className="text-xs font-mono text-zinc-500 uppercase">Requests/m</span>
          <span className="text-lg font-mono text-emerald-500">1.2k</span>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full h-full opacity-60">
        {/* Intricate World Map Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg
            viewBox="0 0 1000 500"
            className="w-full h-full text-zinc-900 fill-current"
          >
            {/* Stable land mass pattern (dots) */}
            {useMemo(() => Array.from({ length: 1200 }).map((_, i) => {
              // Deterministic but random-looking dot pattern
              const x = (Math.sin(i * 1.5) * 500 + 500);
              const y = (Math.cos(i * 1.2) * 250 + 250);
              
              // Only show dots that roughly form continents (simplified logic)
              const isLand = (x > 150 && x < 350 && y > 100 && y < 350) || // Americas
                             (x > 450 && x < 600 && y > 100 && y < 400) || // Europe/Africa
                             (x > 600 && x < 850 && y > 80 && y < 380)  || // Asia
                             (x > 750 && x < 900 && y > 350 && y < 450);   // Australia
              
              if (!isLand) return null;
              
              return (
                <circle 
                  key={i} 
                  cx={x} 
                  cy={y} 
                  r={Math.sin(i) > 0.5 ? 0.8 : 0.4} 
                  className="fill-zinc-800/40"
                />
              );
            }), [])}
          </svg>
        </div>

        {/* Connection Lines (VFX) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {pings.slice(0, 5).map((ping, i) => (
            <motion.path
              key={`line-${i}`}
              d={`M 500 250 Q ${500 + (ping.x - 50) * 5} ${250 + (ping.y - 50) * 2} ${ping.x * 10} ${ping.y * 5}`}
              stroke="url(#lineGrad)"
              strokeWidth="1"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: "linear" }}
            />
          ))}
        </svg>

        {/* Pings */}
        {pings.map((ping) => (
          <div
            key={ping.id}
            className="absolute z-30"
            style={{ left: `${ping.x}%`, top: `${ping.y}%` }}
          >
            <div className="relative flex items-center justify-center">
              <div className="ping-ripple absolute h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)] z-10" />
              
              {/* Tooltip on hover */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity z-50">
                <div className="bg-zinc-900/90 border border-emerald-500/30 px-2 py-1 rounded shadow-xl backdrop-blur-md">
                   <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{ping.action}</p>
                   <p className="text-[7px] text-zinc-500 font-mono">LATENCY: {ping.latency}ms</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 left-6 z-20 flex gap-2">
        {["US-EAST", "EU-WEST", "SA-EAST", "AP-SOUTH"].map(region => (
          <span key={region} className="text-[10px] font-mono text-zinc-600 border border-zinc-800/50 px-1.5 py-0.5 rounded">
            {region}
          </span>
        ))}
      </div>
    </MagneticCard>
  );
}
