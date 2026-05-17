"use client";

import { motion } from "framer-motion";
import { MagneticCard } from "./MagneticCard";
import { Activity, Database, Cloud, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfraHealthMonitorProps {
  latencyTrend: number[];
  systemLoad: {
    cpu: number;
    memory: number;
  };
}

export function InfraHealthMonitor({ latencyTrend, systemLoad }: InfraHealthMonitorProps) {
  // Normalize latency for sparkline (max height 20px)
  const maxLatency = Math.max(...latencyTrend, 100);
  const sparklinePoints = latencyTrend.map((l, i) => ({
    x: (i / (latencyTrend.length - 1)) * 100,
    y: 20 - (l / maxLatency) * 20
  }));

  const pathData = sparklinePoints.length > 0 
    ? `M ${sparklinePoints.map(p => `${p.x},${p.y}`).join(" L ")}`
    : "";

  const services = [
    { name: "API Gateway", icon: Zap, status: "operational", latency: `${latencyTrend[0] || 42}ms` },
    { name: "PostgreSQL", icon: Database, status: "operational", latency: "12ms" },
    { name: "Redis Cache", icon: Activity, status: "operational", latency: "3ms" },
    { name: "S3 Storage", icon: Cloud, status: "operational", latency: "89ms" },
  ];

  return (
    <MagneticCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-zinc-100">Infra Health</h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono text-emerald-500">SYSTEM_OPERATIONAL</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {services.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-medium text-zinc-300">{s.name}</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-sm font-mono text-zinc-100">{s.latency}</span>
              <div className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 rounded uppercase font-bold">
                {s.status}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500 font-medium">Latency Trend (20m)</span>
          <span className="text-xs font-mono text-zinc-400">Avg: {Math.round(latencyTrend.reduce((a, b) => a + b, 0) / (latencyTrend.length || 1))}ms</span>
        </div>
        <div className="h-8 w-full bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-1 flex items-end">
          <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d={pathData}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            <path
              d={`${pathData} L 100,20 L 0,20 Z`}
              fill="url(#sparkline-grad)"
              stroke="none"
            />
          </svg>
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-zinc-800/50 grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
            <span>CPU Load</span>
            <span className="text-zinc-300 font-mono">{systemLoad.cpu}%</span>
          </div>
          <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${systemLoad.cpu}%` }}
              className={cn(
                "h-full transition-all",
                systemLoad.cpu > 80 ? "bg-red-500" : "bg-emerald-500/50"
              )}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
            <span>RAM Usage</span>
            <span className="text-zinc-300 font-mono">{systemLoad.memory}%</span>
          </div>
          <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${systemLoad.memory}%` }}
              className="h-full bg-blue-500/50"
            />
          </div>
        </div>
      </div>
    </MagneticCard>
  );
}


