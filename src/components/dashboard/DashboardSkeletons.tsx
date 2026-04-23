"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="bg-zinc-900/50 border-zinc-800 overflow-hidden relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-4 bg-zinc-800 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse mb-4" />
            <div className="space-y-2">
              <div className="h-1 w-full bg-zinc-800 rounded animate-pulse" />
              <div className="h-2 w-20 bg-zinc-800 rounded animate-pulse" />
            </div>
          </CardContent>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-800/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none" />
        </Card>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="w-full h-[200px] flex items-end gap-2 px-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
          <div 
            className="w-full bg-zinc-800/50 rounded-t-sm animate-pulse" 
            style={{ height: `${20 + (i * 15) % 60}%` }} 
          />
          <div className="h-2 w-8 bg-zinc-800 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function AreaChartSkeleton() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center opacity-20">
       <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
          <path 
            d="M 20,100 Q 100,50 200,80 T 380,40 L 380,150 L 20,150 Z" 
            fill="url(#skeletonGradient)" 
            className="animate-pulse"
          />
          <defs>
            <linearGradient id="skeletonGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
       </svg>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-zinc-800 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 bg-zinc-800 rounded animate-pulse" />
            <div className="h-2 w-1/4 bg-zinc-800 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
