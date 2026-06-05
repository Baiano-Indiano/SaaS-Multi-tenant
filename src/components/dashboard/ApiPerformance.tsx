"use client";

import { useEffect, useState, useMemo } from "react";
import { Activity, Clock, AlertTriangle } from "lucide-react";

export function ApiPerformance() {
  const [latency, setLatency] = useState(24);
  const [requests, setRequests] = useState(842);
  const [errorRate, setErrorRate] = useState(0.04);

  // Sparkline data points (last 10 updates)
  const [latencyHistory, setLatencyHistory] = useState([22, 25, 24, 28, 23, 26, 24, 25, 22, 24]);
  const [requestsHistory, setRequestsHistory] = useState([820, 835, 840, 855, 830, 845, 838, 850, 842, 842]);
  const [errorsHistory, setErrorsHistory] = useState([0.02, 0.05, 0.03, 0.08, 0.04, 0.02, 0.05, 0.03, 0.04, 0.04]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time API variations
      setLatency((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const next = Math.min(Math.max(prev + delta, 15), 45);
        setLatencyHistory((history) => [...history.slice(1), next]);
        return next;
      });

      setRequests((prev) => {
        const delta = Math.floor(Math.random() * 20) - 10; // -10 to +10
        const next = Math.min(Math.max(prev + delta, 600), 1200);
        setRequestsHistory((history) => [...history.slice(1), next]);
        return next;
      });

      setErrorRate((prev) => {
        const delta = (Math.random() * 0.04) - 0.02; // -0.02% to +0.02%
        const next = Math.min(Math.max(prev + delta, 0), 1.5);
        setErrorsHistory((history) => [...history.slice(1), parseFloat(next.toFixed(2))]);
        return parseFloat(next.toFixed(2));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Helper to generate SVG polyline points from history arrays
  const getSvgPoints = (history: number[], width: number, height: number, minVal: number, maxVal: number) => {
    const range = maxVal - minVal || 1;
    const xStep = width / (history.length - 1);
    return history
      .map((val, index) => {
        const x = index * xStep;
        // Invert Y because SVG coordinates start from top-left
        const y = height - ((val - minVal) / range) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };

  const latencyPoints = useMemo(() => getSvgPoints(latencyHistory, 120, 36, 10, 50), [latencyHistory]);
  const requestsPoints = useMemo(() => getSvgPoints(requestsHistory, 120, 36, 500, 1300), [requestsHistory]);
  const errorsPoints = useMemo(() => getSvgPoints(errorsHistory, 120, 36, 0, 2), [errorsHistory]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Latency Card */}
      <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 flex items-center justify-between relative overflow-hidden group">
        <div className="space-y-1 z-10">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-emerald-500/80" />
            Latência Média
          </span>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-2xl font-bold font-mono text-zinc-100">{latency}</span>
            <span className="text-xs text-zinc-500">ms</span>
          </div>
          <span className="text-[9px] text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded font-semibold">
            API Gateway L1
          </span>
        </div>
        <div className="h-10 w-28 opacity-80 group-hover:opacity-100 transition-opacity">
          <svg className="w-full h-full overflow-visible">
            <path
              d={`M ${latencyPoints}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Throughput Card */}
      <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 flex items-center justify-between relative overflow-hidden group">
        <div className="space-y-1 z-10">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-blue-500/80" />
            Vazão de Tráfego
          </span>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-2xl font-bold font-mono text-zinc-100">{requests}</span>
            <span className="text-xs text-zinc-500">req/min</span>
          </div>
          <span className="text-[9px] text-blue-400 bg-blue-500/5 px-1.5 py-0.5 rounded font-semibold">
            Tempo Real (Pusher)
          </span>
        </div>
        <div className="h-10 w-28 opacity-80 group-hover:opacity-100 transition-opacity">
          <svg className="w-full h-full overflow-visible">
            <path
              d={`M ${requestsPoints}`}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Error Rate Card */}
      <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 flex items-center justify-between relative overflow-hidden group">
        <div className="space-y-1 z-10">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-rose-500/80" />
            Taxa de Erros
          </span>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-2xl font-bold font-mono text-zinc-100">{errorRate}%</span>
            <span className="text-xs text-zinc-500">4xx / 5xx</span>
          </div>
          <span className="text-[9px] text-rose-400 bg-rose-500/5 px-1.5 py-0.5 rounded font-semibold">
            Limite Saudável
          </span>
        </div>
        <div className="h-10 w-28 opacity-80 group-hover:opacity-100 transition-opacity">
          <svg className="w-full h-full overflow-visible">
            <path
              d={`M ${errorsPoints}`}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
