"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const SUBSYSTEMS = [
  { name: "Authentication", status: "operational", latency: "14ms", uptime: "99.99%" },
  { name: "Database Cluster", status: "operational", latency: "8ms", uptime: "99.98%" },
  { name: "Edge Runtime", status: "operational", latency: "42ms", uptime: "100%" },
  { name: "Storage Engine", status: "degraded", latency: "124ms", uptime: "98.5%" },
];

export function SubsystemHealth() {
  return (
    <div className="space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 px-1 border-l-2 border-zinc-800 pl-3 ml-1">
        Subsystem Cluster
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SUBSYSTEMS.map((sys) => (
          <div 
            key={sys.name}
            className="p-4 rounded-sm bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700/50 transition-all group relative overflow-hidden"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">
                {sys.name}
              </span>
              {sys.status === "operational" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">
                  <Zap className="w-2.5 h-2.5" />
                  Latency
                </div>
                <div className={cn(
                  "text-xs font-mono font-black",
                  sys.status === "operational" ? "text-zinc-300" : "text-amber-500"
                )}>
                  {sys.latency}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">
                  <Clock className="w-2.5 h-2.5" />
                  Uptime
                </div>
                <div className="text-xs font-mono font-black text-zinc-300">
                  {sys.uptime}
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <div className="mt-4 h-[2px] w-full bg-zinc-800/50 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  sys.status === "operational" ? "bg-emerald-500/50 w-full" : "bg-amber-500/50 w-[85%]"
                )} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
