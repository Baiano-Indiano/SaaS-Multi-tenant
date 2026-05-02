"use client";

import { useCallback, useEffect, useState } from "react";
import { getDeliveryLogsAction } from "@/app/actions/delivery-logs";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCcw, 
  ExternalLink,
  Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Log {
  id: string;
  eventType: string;
  responseStatus: string;
  duration: string;
  createdAt: Date | string;
  workflowTrigger: string | null;
  connectorType: string | null;
  connectorName: string | null;
}

export function DeliveryLogs({ orgId }: { orgId: string }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading && logs.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-4">
        <RefreshCcw className="h-6 w-6 animate-spin text-zinc-700" />
        <p className="text-sm">Loading activity history...</p>
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
          <p className="text-sm font-medium text-zinc-300">No activity yet</p>
          <p className="text-xs text-zinc-500 mt-1">Events will appear here as they are triggered.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Last 50 Deliveries
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchLogs}
          disabled={loading}
          className="h-7 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50"
        >
          <RefreshCcw className={cn("h-3 w-3 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50 border-b border-zinc-800">
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-zinc-500">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-zinc-500">Event</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-zinc-500">Integration</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-zinc-500">Duration</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-zinc-500">Time</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-zinc-500"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {logs.map((log) => {
                  const status = parseInt(log.responseStatus || "0");
                  const isSuccess = status >= 200 && status < 300;
                  
                  return (
                    <motion.tr 
                      key={log.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors"
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
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-600 hover:text-zinc-300 group-hover:opacity-100 opacity-0 transition-opacity">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </motion.tr>
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
