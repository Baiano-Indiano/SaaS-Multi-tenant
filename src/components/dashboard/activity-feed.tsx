"use client";

import * as React from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP);

interface ActivityItem {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: Date;
}

export function ActivityFeed({ activities = [] }: { activities?: ActivityItem[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const t = useTranslations("Dashboard");

  useGSAP(() => {
    if (!containerRef.current || activities.length === 0) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".activity-item", {
        autoAlpha: 0,
        x: -16,
        duration: 0.55,
        stagger: 0.07,
        ease: "power2.out",
      });
    });

    return () => mm.revert();
  }, { scope: containerRef, dependencies: [activities] });

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800">
          <span className="text-zinc-600">∅</span>
        </div>
        <p className="text-zinc-500 text-sm font-medium">{t("noRecentActivity")}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative space-y-8 before:absolute before:inset-y-0 before:left-4 before:w-[1px] before:bg-zinc-800/50">
      {activities.map((activity) => (
        <div key={activity.id} className="activity-item flex items-start gap-6 group relative z-10 p-3 -m-3 rounded-xl transition-all duration-300 hover:bg-white/[0.03] hover:shadow-2xl">
          <div className="relative flex h-8 w-8 items-center justify-center shrink-0">
             <div className="absolute inset-0 rounded-full bg-zinc-950 border border-zinc-800 shadow-xl group-hover:border-zinc-700 transition-colors" />
             <div className={cn(
               "relative h-2 w-2 rounded-full transition-all duration-500 group-hover:scale-125",
               activity.type === "alert" ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] group-hover:shadow-[0_0_15px_rgba(245,158,11,0.8)]" :
               activity.type === "error" ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] group-hover:shadow-[0_0_15px_rgba(239,68,68,0.8)]" :
               "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover:shadow-[0_0_15px_rgba(16,185,129,0.8)]"
             )} />
          </div>

          <div className="flex-1 space-y-1 py-1">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-bold text-zinc-100 leading-tight group-hover:text-white transition-colors">
                {activity.title}
              </p>
              <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest whitespace-nowrap">
                {formatRelativeTime(activity.createdAt)}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-[90%]">
              {activity.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "now";
}
