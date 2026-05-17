"use client";

import React from "react";
import { Activity, Database, Server, Cpu } from "lucide-react";

interface TechnicalHeaderProps {
  tenantName: string;
}

export function TechnicalHeader({ tenantName }: TechnicalHeaderProps) {
  return (
    <div className="dashboard-header w-full flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-b border-zinc-800/50 mb-8">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">System Operational</span>
        </div>
        <h1 className="text-2xl font-black tracking-tighter text-white uppercase">
          Command Center <span className="text-zinc-600">/</span> {tenantName}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-1.5">
            <Server className="h-3 w-3" /> Environment
          </span>
          <span className="text-xs font-black text-zinc-300 uppercase tracking-tighter">Production-v4.2</span>
        </div>

        <div className="hidden lg:flex flex-col">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-1.5">
            <Database className="h-3 w-3" /> Schema
          </span>
          <span className="text-xs font-black text-zinc-300 uppercase tracking-tighter">Tenant_Isolated_Postgres</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-1.5">
            <Cpu className="h-3 w-3" /> Latency
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-black text-zinc-300 uppercase tracking-tighter">12ms</span>
            <span className="text-[8px] font-bold text-emerald-500/70">P99</span>
          </div>
        </div>

        <div className="flex flex-col border-l border-zinc-800 pl-6">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-1.5">
            <Activity className="h-3 w-3" /> Global Traffic
          </span>
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-2.5 w-1 rounded-[1px] ${i < 4 ? 'bg-emerald-500/40' : 'bg-zinc-800'}`} />
              ))}
            </div>
            <span className="text-[10px] font-bold text-emerald-500 ml-1">Normal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
