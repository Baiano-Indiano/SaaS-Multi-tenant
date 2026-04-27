"use client";

import * as React from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  Card,
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

gsap.registerPlugin(useGSAP);

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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const reduceMotionRef = React.useRef(false);
  const onCardMouseEnterRef = React.useRef<(e: React.MouseEvent<HTMLDivElement>) => void>(() => {});
  const onCardMouseLeaveRef = React.useRef<(e: React.MouseEvent<HTMLDivElement>) => void>(() => {});

  useGSAP((_, contextSafe) => {
    if (!containerRef.current) return;
    const safe = contextSafe ?? ((fn: (e: React.MouseEvent<HTMLDivElement>) => void) => fn);

    const statValues = containerRef.current.querySelectorAll<HTMLElement>(".stat-value");
    
    // Set initial values for counter
    statValues.forEach((el) => {
      el.textContent = "0";
    });

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      reduceMotionRef.current = true;
      statValues.forEach((el) => {
        el.textContent = el.getAttribute("data-value") || "0";
      });
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      reduceMotionRef.current = false;

      // Card Staggered Entry
      gsap.from(".analytics-card", {
        autoAlpha: 0,
        y: 20,
        duration: 0.8,
        stagger: 0.1,
        ease: "power4.out",
      });

      // Stat Counters (Premium Data Entry)
      statValues.forEach((el) => {
        const finalValue = Number(el.getAttribute("data-value") || "0");
        if (Number.isNaN(finalValue)) return;

        const counter = { value: 0 };
        gsap.to(counter, {
          value: finalValue,
          duration: 1.5,
          ease: "expo.out",
          delay: 0.2,
          onUpdate: () => {
            el.textContent = String(Math.floor(counter.value));
          },
        });
      });

      // Progress Bar Animation
      gsap.from(".progress-bar-inner", {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1.2,
        delay: 0.5,
        ease: "expo.out",
      });
    });

    onCardMouseEnterRef.current = safe((e: React.MouseEvent<HTMLDivElement>) => {
      if (reduceMotionRef.current) return;

      const card = e.currentTarget;
      const icon = card.querySelector(".widget-icon");
      const bgIcon = card.querySelector(".bg-icon");

      gsap.to(card, {
        y: -4,
        borderColor: "rgba(255, 255, 255, 0.2)",
        backgroundColor: "rgba(24, 24, 27, 0.7)",
        boxShadow: "0 10px 30px -15px rgba(0,0,0,0.5)",
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });

      if (icon) {
        gsap.to(icon, {
          scale: 1.2,
          color: "#fff",
          duration: 0.3,
          ease: "back.out(2)",
          overwrite: "auto",
        });
      }

      if (bgIcon) {
        gsap.to(bgIcon, {
          scale: 1.1,
          rotation: 5,
          opacity: 0.12,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    });

    onCardMouseLeaveRef.current = safe((e: React.MouseEvent<HTMLDivElement>) => {
      if (reduceMotionRef.current) return;

      const card = e.currentTarget;
      const icon = card.querySelector(".widget-icon");
      const bgIcon = card.querySelector(".bg-icon");

      gsap.to(card, {
        y: 0,
        borderColor: "rgba(39, 39, 42, 1)",
        backgroundColor: "rgba(24, 24, 27, 0.5)",
        boxShadow: "none",
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });

      if (icon) {
        gsap.to(icon, {
          scale: 1,
          color: "rgba(161, 161, 170, 1)",
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto",
        });
      }

      if (bgIcon) {
        gsap.to(bgIcon, {
          scale: 1,
          rotation: 0,
          opacity: 0.05,
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    });

    return () => {
      mm.revert();
    };
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      <div
        className="analytics-card"
        onMouseEnter={(e) => onCardMouseEnterRef.current(e)}
        onMouseLeave={(e) => onCardMouseLeaveRef.current(e)}
      >
        <Card className="bg-zinc-900/50 border-zinc-800 transition-colors group relative overflow-hidden">
          <div className="bg-icon absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <LayoutGrid className="h-24 w-24 -mr-8 -mt-8" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
              {t("activeProjects")}
            </CardTitle>
            <LayoutGrid className="widget-icon h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div
                className="stat-value text-3xl font-black text-white"
                data-value={stats.totalProjects}
              >
                0
              </div>
              <div className="text-xs text-zinc-500 font-medium">/{stats.quotas.maxProjects}</div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                 <div 
                   className="progress-bar-inner h-full bg-emerald-500 origin-left" 
                   style={{ width: `${(stats.totalProjects / stats.quotas.maxProjects) * 100}%` }}
                 />
              </div>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                {t("capacityUsed", { percent: Math.round((stats.totalProjects / stats.quotas.maxProjects) * 100) })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        className="analytics-card"
        onMouseEnter={(e) => onCardMouseEnterRef.current(e)}
        onMouseLeave={(e) => onCardMouseLeaveRef.current(e)}
      >
        <Card className="bg-zinc-900/50 border-zinc-800 transition-colors group relative overflow-hidden">
          <div className="bg-icon absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Users className="h-24 w-24 -mr-8 -mt-8" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
              {t("totalMembers")}
            </CardTitle>
            <Users className="widget-icon h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div
                className="stat-value text-3xl font-black text-white"
                data-value={stats.totalMembers}
              >
                0
              </div>
              <div className="text-xs text-zinc-500 font-medium">/{stats.quotas.maxMembers}</div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                 <div 
                   className="progress-bar-inner h-full bg-zinc-400 origin-left" 
                   style={{ width: `${(stats.totalMembers / stats.quotas.maxMembers) * 100}%` }}
                 />
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                  {stats.pendingInvites > 0 ? t("pending", { count: stats.pendingInvites }) : t("activeSeats")}
                </p>
                <p className="text-[10px] text-zinc-400 font-bold">
                  {Math.round((stats.totalMembers / stats.quotas.maxMembers) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        className="analytics-card"
        onMouseEnter={(e) => onCardMouseEnterRef.current(e)}
        onMouseLeave={(e) => onCardMouseLeaveRef.current(e)}
      >
        <Card className="bg-zinc-900/50 border-zinc-800 transition-colors group relative overflow-hidden">
          <div className="bg-icon absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Shield className="h-24 w-24 -mr-8 -mt-8" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
              {t("customRoles")}
            </CardTitle>
            <Shield className="widget-icon h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div
              className="stat-value text-3xl font-black text-white"
              data-value={stats.totalRoles}
            >
              0
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-medium">
              {t("accessProfiles")}
            </p>
            <div className="mt-4 flex gap-1">
               {[...Array(stats.totalRoles)].map((_, i) => (
                 <div key={i} className="h-1 w-4 bg-zinc-700 rounded-full" />
               ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        className="analytics-card"
        onMouseEnter={(e) => onCardMouseEnterRef.current(e)}
        onMouseLeave={(e) => onCardMouseLeaveRef.current(e)}
      >
        <Card className="bg-zinc-900/50 border-zinc-800 transition-colors group relative overflow-hidden">
          <div className="bg-icon absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Zap className="h-24 w-24 -mr-8 -mt-8" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
              {t("apiUsage")}
            </CardTitle>
            <Zap className="widget-icon h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="stat-value text-3xl font-black text-white" data-value={84}>0</div>
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">%</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                 <div 
                   className="progress-bar-inner h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)] origin-left" 
                   style={{ width: "84%" }}
                 />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t("planLimit")}</span>
                <span className="text-[10px] text-zinc-400 font-black">1.2M/5M</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

