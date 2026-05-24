"use client";

import React, { useEffect, useState, useRef } from "react";
import { Terminal } from "lucide-react";
import { useTranslations } from "next-intl";

interface LogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  latency: string;
}

export function LogStream() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Dashboard");

  useEffect(() => {
    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
    const paths = ["/api/v1/projects", "/api/v1/auth/session", "/api/v1/members", "/api/v1/webhooks", "/api/v1/stats"];
    const statuses = [200, 201, 204, 404, 500];

    const generateLog = () => {
      const entry: LogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        method: methods.at(Math.floor(Math.random() * methods.length)) || "GET",
        path: paths.at(Math.floor(Math.random() * paths.length)) || "",
        status: statuses.at(Math.floor(Math.random() * statuses.length)) || 200,
        latency: `${Math.floor(Math.random() * 100 + 10)}ms`,
      };
      setLogs((prev) => [...prev.slice(-7), entry]);
    };

    const interval = setInterval(generateLog, 3000);
    generateLog(); // Initial log

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full min-h-[160px] bg-black/40 rounded-sm border border-zinc-800/50 overflow-hidden font-mono text-[10px]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/50 bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <Terminal className="h-3 w-3 text-zinc-500" />
          <span className="text-zinc-500 font-bold uppercase tracking-widest">{t("logStream.systemEvents")}</span>
        </div>
        <div className="flex gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
          <div className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
          <div className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
        {logs.map((log) => (
          <div key={log.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-1 duration-500">
            <span className="text-zinc-600">[{log.timestamp}]</span>
            <span className={
              log.method === "POST" ? "text-emerald-500" : 
              log.method === "DELETE" ? "text-red-500" : 
              "text-blue-500"
            }>{log.method}</span>
            <span className="text-zinc-400 flex-1 truncate">{log.path}</span>
            <span className={log.status >= 400 ? "text-amber-500" : "text-zinc-500"}>{log.status}</span>
            <span className="text-zinc-600">{log.latency}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-zinc-700 italic">{t("logStream.awaitingEvents")}</div>
        )}
      </div>
    </div>
  );
}
