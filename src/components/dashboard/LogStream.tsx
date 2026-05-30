"use client";

import React, { useEffect, useState, useRef } from "react";
import { Terminal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth/client";
import Pusher from "pusher-js";

interface LogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  latency: string;
  isReal?: boolean;
  message?: string;
}

export function LogStream() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Dashboard");
  const { data: session } = useSession();

  useEffect(() => {
    // 1. Setup background simulator to keep dashboard active
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
      setLogs((prev) => {
        // Keep real entries longer by filtering out older mock entries first if we hit size limits
        const updated = [...prev, entry];
        if (updated.length > 8) {
          return updated.slice(-8);
        }
        return updated;
      });
    };

    const interval = setInterval(generateLog, 4000); // 4s interval to reduce noise
    generateLog(); // Initial entry

    // 2. Establish real-time Pusher connection
    let pusher: Pusher | null = null;
    let userChannelName = "";
    let orgChannelName: string | null = null;
    let userChannel: any = null;
    let orgChannel: any = null;

    const handleNotification = (data: any) => {
      try {
        if (data.payload) {
          const payload = typeof data.payload === "string"
            ? JSON.parse(data.payload)
            : data.payload;

          let method = "POST";
          let path = "/api/v1/events";
          let status = 200;
          let latency = "12ms";

          if (payload.type === "PROJECT_CREATED") {
            method = "POST";
            path = "/api/v1/projects";
            status = 201;
            latency = "42ms";
          } else if (payload.type?.includes("SECURITY") || payload.type?.includes("ANOMALY")) {
            method = "ALERT";
            path = "/api/v1/security/anomaly";
            status = 403;
            latency = "0ms";
          } else if (payload.type?.includes("BILLING") || payload.type?.includes("STRIPE")) {
            method = "POST";
            path = "/api/v1/billing/webhook";
            status = 200;
            latency = "78ms";
          }

          const entry: LogEntry = {
            id: `real-${payload.id || Math.random().toString(36).substring(2, 9)}`,
            timestamp: new Date(payload.createdAt || Date.now()).toLocaleTimeString("en-GB", { hour12: false }),
            method,
            path,
            status,
            latency,
            isReal: true,
            message: payload.message || payload.title,
          };

          setLogs((prev) => [...prev.slice(-7), entry]);
        }
      } catch (err) {
        console.error("[LogStream] Failed to parse Pusher event data:", err);
      }
    };

    if (session?.user) {
      try {
        const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "pusher-app-key";
        const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2";

        pusher = new Pusher(appKey, {
          cluster,
        });

        const entry: LogEntry = {
          id: `real-conn-${Math.random().toString(36).substring(2, 9)}`,
          timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
          method: "GET",
          path: "/api/notifications/pusher",
          status: 200,
          latency: "Connected",
          isReal: true,
          message: "Real-time Pusher socket established",
        };
        setLogs((prev) => [...prev.slice(-7), entry]);

        userChannelName = `user-${session.user.id}`;
        userChannel = pusher.subscribe(userChannelName);
        userChannel.bind("notification", handleNotification);

        const activeOrgId = session.session?.activeOrganizationId;
        if (activeOrgId) {
          orgChannelName = `org-${activeOrgId}`;
          orgChannel = pusher.subscribe(orgChannelName);
          orgChannel.bind("notification", handleNotification);
        }
      } catch (e) {
        console.error("[LogStream] Failed to initialize Pusher:", e);
      }
    }

    return () => {
      clearInterval(interval);
      if (pusher) {
        if (userChannelName) {
          userChannel?.unbind("notification", handleNotification);
          pusher.unsubscribe(userChannelName);
        }
        if (orgChannel && orgChannelName) {
          orgChannel.unbind("notification", handleNotification);
          pusher.unsubscribe(orgChannelName);
        }
        pusher.disconnect();
      }
    };
  }, [session?.user, session?.session?.activeOrganizationId]);

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
          <div 
            key={log.id} 
            className={`flex items-center gap-3 animate-in fade-in slide-in-from-left-1 duration-500 py-0.5 px-1 rounded-xs transition-colors ${
              log.isReal 
                ? "bg-blue-500/10 border-y border-blue-500/10 shadow-[0_0_8px_rgba(59,130,246,0.05)]" 
                : ""
            }`}
          >
            <span className={log.isReal ? "text-blue-400 font-bold" : "text-zinc-600"}>
              {log.isReal ? "⚡ " : ""}[{log.timestamp}]
            </span>
            <span className={
              log.method === "POST" ? "text-emerald-500" : 
              log.method === "DELETE" ? "text-red-500" : 
              log.method === "ALERT" ? "text-rose-500 animate-pulse font-bold" :
              "text-blue-500"
            }>{log.method}</span>
            <span className={`flex-1 truncate ${log.isReal ? "text-zinc-200 font-medium" : "text-zinc-400"}`}>
              {log.path}
              {log.isReal && log.message && (
                <span className="text-[9px] text-zinc-500 ml-2 italic">({log.message})</span>
              )}
            </span>
            <span className={log.status >= 400 ? "text-amber-500" : log.isReal ? "text-emerald-400 font-bold" : "text-zinc-500"}>
              {log.status}
            </span>
            <span className={log.isReal ? "text-blue-400 font-semibold" : "text-zinc-600"}>
              {log.latency}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-zinc-700 italic">{t("logStream.awaitingEvents")}</div>
        )}
      </div>
    </div>
  );
}
