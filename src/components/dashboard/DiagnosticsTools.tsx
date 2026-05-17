"use client";

import { useState } from "react";
import { MagneticCard } from "./MagneticCard";
import { Shield, RefreshCcw, Terminal, Code2, Loader2, CheckCircle2, Database } from "lucide-react";
import { SecurityTerminal, type AuditLog } from "./SecurityTerminal";
import { ApiPlayground } from "./ApiPlayground";
import { revalidateCacheAction } from "@/app/actions/system";
import { toast } from "sonner";

interface DiagnosticsToolsProps {
  logs: AuditLog[];
  cacheStats: {
    hitRate: number;
    revalidationStatus: string;
    lastPurge: string;
  };
}

export function DiagnosticsTools({ logs, cacheStats }: DiagnosticsToolsProps) {
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [hasRevalidated, setHasRevalidated] = useState(false);

  const handleRevalidate = async () => {
    setIsRevalidating(true);
    try {
      await revalidateCacheAction();
      toast.success("System cache revalidated successfully");
      setHasRevalidated(true);
      setTimeout(() => setHasRevalidated(false), 3000);
    } catch {
      toast.error("Failed to revalidate cache");
    } finally {
      setIsRevalidating(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 px-1 border-l-2 border-zinc-500/50 pl-3 ml-1">
        Diagnostic Tools
      </h2>
      <MagneticCard className="p-4 bg-zinc-900/10 border-dashed border-zinc-800">
        <div className="space-y-3">
          <button 
            onClick={() => setTerminalOpen(true)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 transition-colors border border-zinc-800 group"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Request Inspector</span>
            </div>
            <span className="text-[8px] bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-500 font-mono">ACTIVE</span>
          </button>
          
          <button 
            onClick={() => setSandboxOpen(true)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 transition-colors border border-zinc-800 group"
          >
            <div className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-500 transition-colors" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">API Sandbox</span>
            </div>
            <span className="text-[8px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 font-mono">v1.2</span>
          </button>

          <div className="pt-2 space-y-3">
             <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-600">
                    <div className="flex items-center gap-1">
                        <Database className="w-2.5 h-2.5" />
                        <span>CACHE_HIT_RATE</span>
                    </div>
                    <span>{cacheStats.hitRate}%</span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500/40" style={{ width: `${cacheStats.hitRate}%` }} />
                </div>
             </div>

             <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-600">
                    <div className="flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />
                        <span>SECURITY_SCAN</span>
                    </div>
                    <span>PASSED</span>
                </div>
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500/20 w-full" />
                </div>
             </div>
          </div>

          <button 
            onClick={handleRevalidate}
            disabled={isRevalidating}
            className="w-full mt-2 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isRevalidating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : hasRevalidated ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            ) : (
              <RefreshCcw className="w-3 h-3" />
            )}
            {isRevalidating ? "Revalidating..." : "Revalidate System Cache"}
          </button>
        </div>
      </MagneticCard>

      <SecurityTerminal 
        isOpen={terminalOpen} 
        onClose={() => setTerminalOpen(false)} 
        logs={logs}
      />
      
      <ApiPlayground 
        isOpen={sandboxOpen} 
        onClose={() => setSandboxOpen(false)} 
      />
    </div>
  );
}
