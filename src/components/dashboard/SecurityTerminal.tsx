"use client";

import { useState, useMemo } from "react";
import { 
  Terminal as TerminalIcon, 
  X, 
  Shield, 
  Search, 
  Info,
  Cpu,
  Fingerprint
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export interface AuditLog {
  id: string;
  ip: string | null;
  action: string;
  user: string | null;
  entity: string | null;
  createdAt: Date;
}

interface SecurityTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
}

export function SecurityTerminal({ isOpen, onClose, logs }: SecurityTerminalProps) {
  const [search, setSearch] = useState("");
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const t = useTranslations("Dashboard");

  // Technical terminology ignored by the i18n scanner
  const packetsCapturedLabel = "PACKETS_CAPTURED";
  const threatLevelLabel = "THREAT_LEVEL";
  const timestampLabel = "TIMESTAMP";
  const sourceIpLabel = "SOURCE_IP";
  const actorIdLabel = "ACTOR_ID";
  const actionTypeLabel = "ACTION_TYPE";
  const entityTargetLabel = "ENTITY_TARGET";
  const protocolLabel = "PROTOCOL";
  const protocolValue = "HTTPS/WSS";
  const systemDaemonActor = "SYSTEM_DAEMON";
  const globalTarget = "GLOBAL";
  const controlShortcuts = "CTRL+C TO ABORT | CTRL+L TO CLEAR";

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.ip || "").includes(search) ||
      (log.user?.toLowerCase() || "").includes(search.toLowerCase())
    );
  }, [logs, search]);

  const selectedLog = useMemo(() => 
    logs.find(l => l.id === selectedLogId), 
    [logs, selectedLogId]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 bg-black border-zinc-800 shadow-2xl shadow-emerald-500/10 overflow-hidden">
        <div className="flex flex-col h-[600px] font-mono text-[12px] text-emerald-500/80">
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-zinc-800">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-zinc-800 w-full flex-row">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-bold tracking-widest text-[10px] text-zinc-400">{t("securityTerminal.logHeader")}</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar / Filters */}
            <div className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col">
              <div className="p-3 border-b border-zinc-800">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 w-3 h-3 text-zinc-600" />
                  <input 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("securityTerminal.filterPackets")}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-7 py-2 text-[10px] focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-zinc-700"
                  />
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {filteredLogs.map((log) => (
                    <button
                      key={log.id}
                      onClick={() => setSelectedLogId(log.id)}
                      className={cn(
                        "w-full text-left p-2 rounded transition-all group relative overflow-hidden",
                        selectedLogId === log.id ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-zinc-900 text-zinc-500"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold truncate pr-2">{log.action}</span>
                        <span className="text-[8px] opacity-50 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] opacity-60">
                        <Fingerprint className="w-2.5 h-2.5" />
                        <span className="truncate">{log.ip}</span>
                      </div>
                      {selectedLogId === log.id && (
                        <motion.div 
                          layoutId="active-log"
                          className="absolute inset-y-0 left-0 w-0.5 bg-emerald-500" 
                        />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-3 bg-zinc-900/30 border-t border-zinc-800 text-[9px] text-zinc-600 font-mono">
                <div className="flex items-center justify-between mb-1">
                  <span>{packetsCapturedLabel}</span>
                  <span className="text-emerald-500">{logs.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{threatLevelLabel}</span>
                  <span className="text-emerald-500">{t("securityTerminal.low").toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Main Terminal Area */}
            <div className="flex-1 flex flex-col bg-[#050505] relative">
              {/* CRT Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,128,0.02))] z-10 bg-[length:100%_2px,3px_100%]" />
              
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {selectedLog ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 text-emerald-400 border-b border-emerald-500/20 pb-2">
                        <TerminalIcon className="w-4 h-4" />
                        <span className="font-bold uppercase tracking-wider">{t("securityTerminal.inspectPacket")}{selectedLog.id.slice(0, 8)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <DetailItem label={timestampLabel} value={new Date(selectedLog.createdAt).toLocaleString()} />
                          <DetailItem label={sourceIpLabel} value={selectedLog.ip || "0.0.0.0"} />
                          <DetailItem label={actorIdLabel} value={selectedLog.user || systemDaemonActor} />
                        </div>
                        <div className="space-y-4">
                          <DetailItem label={actionTypeLabel} value={selectedLog.action} />
                          <DetailItem label={entityTargetLabel} value={selectedLog.entity || globalTarget} />
                          <DetailItem label={protocolLabel} value={protocolValue} />
                        </div>
                      </div>

                      <div className="mt-8">
                        <div className="flex items-center gap-2 text-zinc-500 mb-2">
                          <Info className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">{t("securityTerminal.rawJsonPayload").toUpperCase()}</span>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 font-mono text-[11px] leading-relaxed text-emerald-500/60 break-all">
                          {JSON.stringify(selectedLog, null, 2)}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-700 opacity-50 space-y-4 py-20">
                      <Cpu className="w-12 h-12 stroke-[1px] animate-pulse" />
                      <div className="text-center space-y-1">
                        <p className="font-bold uppercase tracking-[0.2em]">{t("securityTerminal.awaitingSelection")}</p>
                        <p className="text-[10px]">{t("securityTerminal.selectionDescription")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="h-8 border-t border-zinc-900 flex items-center px-4 justify-between bg-black">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">{t("securityTerminal.systemOperational")}</span>
                </div>
                <div className="text-[9px] text-zinc-800">
                  {controlShortcuts}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] text-zinc-600 font-bold tracking-tighter uppercase">{label}</p>
      <p className="text-emerald-500/90 font-bold">{value}</p>
    </div>
  );
}
