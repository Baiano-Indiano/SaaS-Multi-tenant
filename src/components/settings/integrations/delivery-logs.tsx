"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getDeliveryLogsAction, retryWebhookDeliveryAction } from "@/app/actions/delivery-logs";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCcw, 
  ChevronRight,
  Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface Log {
  id: string;
  eventType: string;
  payload: string;
  responseStatus: string;
  responseBody: string | null;
  duration: string;
  createdAt: Date | string;
  workflowTrigger: string | null;
  connectorType: string | null;
  connectorName: string | null;
  webhookUrl: string | null;
}

export function DeliveryLogs({ orgId }: { orgId: string }) {
  const t = useTranslations("Settings.integrations");
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const data = await getDeliveryLogsAction(orgId);
    setLogs(data as Log[]);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const data = await getDeliveryLogsAction(orgId);
      if (isMounted) {
        setLogs(data as Log[]);
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orgId]);

  const handleRetry = async (logId: string) => {
    try {
      setRetryingId(logId);
      const res = await retryWebhookDeliveryAction(orgId, logId);
      if (res.success) {
        toast.success(t("retrySuccess"));
        fetchLogs();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      toast.error(`${t("retryFailed")}: ${msg}`);
    } finally {
      setRetryingId(null);
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-4">
        <RefreshCcw className="h-6 w-6 animate-spin text-zinc-700" />
        <p className="text-sm">{t("loadingActivity")}</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-4 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
        <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
          <Activity className="h-5 w-5 text-zinc-700" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-300">{t("noActivity")}</p>
          <p className="text-xs text-zinc-500 mt-1">{t("activityInstructions")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {t("last50Deliveries")}
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchLogs}
          disabled={loading}
          className="h-7 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50"
        >
          <RefreshCcw className={cn("h-3 w-3 mr-2", loading && "animate-spin")} />
          {t("refresh")}
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50 border-b border-zinc-800">
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-zinc-500">{t("statusHeader")}</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-zinc-500">{t("eventHeader")}</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-zinc-500">{t("integrationHeader")}</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-zinc-500">{t("durationHeader")}</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-zinc-500">{t("timeHeader")}</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-zinc-500"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {logs.map((log) => {
                  const status = parseInt(log.responseStatus || "0");
                  const isSuccess = status >= 200 && status < 300;
                  const isExpanded = expandedId === log.id;
                  
                  return (
                    <React.Fragment key={log.id}>
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "group border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors cursor-pointer",
                          isExpanded && "bg-zinc-800/10"
                        )}
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isSuccess ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-rose-500" />
                            )}
                            <span className={cn(
                              "text-xs font-mono font-bold",
                              isSuccess ? "text-emerald-400" : "text-rose-400"
                            )}>
                              {log.responseStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-zinc-200">
                              {log.eventType}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] bg-zinc-800/30 border-zinc-700 text-zinc-400 py-0 h-5">
                              {log.connectorType || "Webhook"}
                            </Badge>
                            <span className="text-[11px] text-zinc-500 truncate max-w-[120px]">
                              {log.connectorName || "General"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center text-[11px] text-zinc-500">
                            <Clock className="h-3 w-3 mr-1 opacity-50" />
                            {log.duration}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-zinc-500">
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRetry(log.id)}
                              disabled={retryingId !== null}
                              className="h-7 px-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
                            >
                              <RefreshCcw className={cn("h-3 w-3 mr-1.5", retryingId === log.id && "animate-spin")} />
                              {retryingId === log.id ? t("retrying") : t("retryDelivery")}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setExpandedId(isExpanded ? null : log.id)}
                              className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
                            >
                              <ChevronRight className={cn("h-3.5 w-3.5 transform transition-transform", isExpanded && "rotate-90")} />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>

                      {isExpanded && (
                        <tr className="bg-zinc-950/40 border-b border-zinc-800/50">
                          <td colSpan={6} className="px-6 py-4">
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-3 text-xs"
                            >
                              {log.webhookUrl && (
                                <div>
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Target URL</span>
                                  <code className="text-zinc-300 bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800 block truncate font-mono text-[11px]">{log.webhookUrl}</code>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Payload (JSON)</span>
                                  <pre className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800 overflow-x-auto text-[11px] font-mono text-zinc-300 max-h-48 scrollbar-thin">
                                    {(() => {
                                      try {
                                        return JSON.stringify(JSON.parse(log.payload), null, 2);
                                      } catch {
                                        return log.payload;
                                      }
                                    })()}
                                  </pre>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Response Body</span>
                                  {log.responseBody ? (
                                    <pre className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800 overflow-x-auto text-[11px] font-mono text-zinc-300 max-h-48 scrollbar-thin">
                                      {log.responseBody}
                                    </pre>
                                  ) : (
                                    <div className="bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/40 text-zinc-500 italic">
                                      Nenhum corpo de resposta retornado.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
