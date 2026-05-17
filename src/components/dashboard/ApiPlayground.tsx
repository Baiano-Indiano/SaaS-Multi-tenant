"use client";

import { useState } from "react";
import { 
  Play, 
  Code2, 
  CheckCircle2, 
  Loader2, 
  X, 
  Braces,
  Cpu,
  Database,
  Globe
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { executeDiagnosticAction } from "@/app/actions/system";

interface ApiPlaygroundProps {
  isOpen: boolean;
  onClose: () => void;
}

const ENDPOINTS = [
  { id: "ping", name: "System Ping", icon: Globe, description: "Check global edge latency" },
  { id: "db_check", name: "Database Health", icon: Database, description: "Verify connection pool status" },
  { id: "redis_check", name: "Cache Diagnostics", icon: Cpu, description: "Analyze memory and hit rate" },
];

export function ApiPlayground({ isOpen, onClose }: ApiPlaygroundProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState(ENDPOINTS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<unknown>(null);

  const handleRun = async () => {
    setIsLoading(true);
    setResponse(null);
    try {
      const result = await executeDiagnosticAction(selectedEndpoint.id);
      setResponse(result);
    } catch {
      setResponse({ error: "Failed to execute diagnostic request" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 bg-zinc-950 border-zinc-900 shadow-2xl shadow-blue-500/5 overflow-hidden">
        <div className="flex flex-col h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Code2 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-200">API Sandbox</h3>
                <p className="text-[10px] text-zinc-500 font-mono">v1.2.0-alpha</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-zinc-900 rounded transition-colors text-zinc-600 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-48 border-r border-zinc-900 p-2 space-y-1">
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2 py-1 mb-2">Endpoints</p>
              {ENDPOINTS.map((ep) => {
                const Icon = ep.icon;
                return (
                  <button
                    key={ep.id}
                    onClick={() => setSelectedEndpoint(ep)}
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded text-[10px] font-bold transition-all",
                      selectedEndpoint.id === ep.id 
                        ? "bg-blue-500/10 text-blue-400" 
                        : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{ep.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col bg-zinc-950">
              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-zinc-200">{selectedEndpoint.name}</h4>
                    <span className="text-[10px] font-mono text-zinc-600">GET /api/diagnostics/{selectedEndpoint.id}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    {selectedEndpoint.description}. This operation executes a real-time probe on the specified subsystem and returns a detailed telemetry payload.
                  </p>
                </div>

                <div className="flex-1 relative">
                  <div className="absolute inset-0 bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/80">
                      <div className="flex items-center gap-2">
                        <Braces className="w-3.5 h-3.5 text-zinc-600" />
                        <span className="text-[10px] font-mono text-zinc-500">RESPONSE_BODY</span>
                      </div>
                      {response !== null && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>200 OK</span>
                        </div>
                      )}
                    </div>
                    
                    <ScrollArea className="flex-1">
                      <div className="p-4 font-mono text-[11px]">
                        {isLoading ? (
                          <div className="flex flex-col items-center justify-center py-12 text-zinc-600 space-y-3">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-[10px] animate-pulse">EXECUTING_PROBE...</span>
                          </div>
                        ) : response !== null ? (
                          <pre className="text-blue-400/90 whitespace-pre-wrap break-all">
                            {JSON.stringify(response, null, 2)}
                          </pre>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-zinc-700 space-y-2">
                            <Play className="w-6 h-6 opacity-20" />
                            <span className="text-[10px] font-bold opacity-30">READY_FOR_EXECUTION</span>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleRun}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 px-6 py-2 rounded-lg text-[11px] font-bold text-white transition-all shadow-lg shadow-blue-600/20 group"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    )}
                    RUN DIAGNOSTIC
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
