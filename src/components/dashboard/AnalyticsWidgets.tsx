"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { GsapCounter } from "@/components/ui/gsap-counter";
import { GsapEntrance } from "@/components/ui/gsap-entrance";
import { MagneticCard } from "./MagneticCard";
import {
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  LayoutGrid,
  Users,
  Shield,
  Zap
} from "lucide-react";
import { useTranslations } from "next-intl";

interface AnalyticsWidgetsProps {
  stats: {
    totalProjects: number;
    totalMembers: number;
    pendingInvites: number;
    totalRoles: number;
    quotas: {
      maxMembers: number;
      maxProjects: number;
    };
  };
}

export function AnalyticsWidgets({ stats }: AnalyticsWidgetsProps) {
  const t = useTranslations("Dashboard");
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Progress Bar Animation
      gsap.from(".progress-bar-inner", {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1.2,
        delay: 0.5,
        ease: "expo.out",
      });
    });

    return () => {
      mm.revert();
    };
  }, { scope: containerRef });

  return (
    <div ref={containerRef}>
      <GsapEntrance 
        stagger={0.1}
        duration={0.8}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <MagneticCard className="h-full">
            <div className="bg-icon absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <LayoutGrid className="h-24 w-24 -mr-8 -mt-8" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                {t("activeProjects")}
              </CardTitle>
              <LayoutGrid className="widget-icon h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <GsapCounter
                  className="text-3xl font-black text-white tracking-tight"
                  value={stats.totalProjects}
                />
                <div className="text-xs text-zinc-500 font-bold tracking-tighter">/{stats.quotas.maxProjects}</div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                   <div 
                     className="progress-bar-inner h-full bg-emerald-500 origin-left" 
                     style={{ width: `${(stats.totalProjects / stats.quotas.maxProjects) * 100}%` }}
                   />
                </div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  {t("capacityUsed", { percent: Math.round((stats.totalProjects / stats.quotas.maxProjects) * 100) })}
                </p>
              </div>
            </CardContent>
        </MagneticCard>

        <MagneticCard className="h-full">
            <div className="bg-icon absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Users className="h-24 w-24 -mr-8 -mt-8" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                {t("totalMembers")}
              </CardTitle>
              <Users className="widget-icon h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <GsapCounter
                  className="text-3xl font-black text-white tracking-tight"
                  value={stats.totalMembers}
                />
                <div className="text-xs text-zinc-500 font-bold tracking-tighter">/{stats.quotas.maxMembers}</div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                   <div 
                     className="progress-bar-inner h-full bg-zinc-400 origin-left" 
                     style={{ width: `${(stats.totalMembers / stats.quotas.maxMembers) * 100}%` }}
                   />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    {stats.pendingInvites > 0 ? t("pending", { count: stats.pendingInvites }) : t("activeSeats")}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-black">
                    {Math.round((stats.totalMembers / stats.quotas.maxMembers) * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
        </MagneticCard>

        <MagneticCard className="h-full">
            <div className="bg-icon absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Shield className="h-24 w-24 -mr-8 -mt-8" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                {t("customRoles")}
              </CardTitle>
              <Shield className="widget-icon h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <GsapCounter
                className="text-3xl font-black text-white tracking-tight"
                value={stats.totalRoles}
              />
              <p className="text-[10px] text-zinc-500 mt-1 font-bold uppercase tracking-widest">
                {t("accessProfiles")}
              </p>
              <div className="mt-4 flex gap-1">
                 {[...Array(Math.min(stats.totalRoles, 10))].map((_, i) => (
                   <div key={i} className="h-1 w-4 bg-zinc-700 rounded-full" />
                 ))}
                 {stats.totalRoles > 10 && <div className="text-[8px] text-zinc-600 font-bold">...</div>}
              </div>
            </CardContent>
        </MagneticCard>

        <MagneticCard className="h-full">
            <div className="bg-icon absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Zap className="h-24 w-24 -mr-8 -mt-8" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                {t("apiUsage")}
              </CardTitle>
              <Zap className="widget-icon h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <GsapCounter
                  className="text-3xl font-black text-white tracking-tight"
                  value={84}
                  suffix="%"
                />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                   <div 
                     className="progress-bar-inner h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)] origin-left" 
                     style={{ width: "84%" }}
                   />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t("planLimit")}</span>
                  <span className="text-[10px] text-zinc-400 font-black">1.2M/5M</span>
                </div>
              </div>
            </CardContent>
        </MagneticCard>
      </GsapEntrance>
    </div>
  );
}

