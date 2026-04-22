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
  Database
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const reduceMotionRef = React.useRef(false);
  const onCardMouseEnterRef = React.useRef<(e: React.MouseEvent<HTMLDivElement>) => void>(() => {});
  const onCardMouseLeaveRef = React.useRef<(e: React.MouseEvent<HTMLDivElement>) => void>(() => {});

  useGSAP((_, contextSafe) => {
    if (!containerRef.current) return;
    const safe = contextSafe ?? ((fn: (e: React.MouseEvent<HTMLDivElement>) => void) => fn);

    const statValues = containerRef.current.querySelectorAll<HTMLElement>(".stat-value");
    statValues.forEach((el) => {
      const finalValue = Number(el.getAttribute("data-value") || "0");
      if (!Number.isNaN(finalValue)) {
        el.textContent = String(finalValue);
      }
    });

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      reduceMotionRef.current = true;
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      reduceMotionRef.current = false;

      gsap.from(".analytics-card", {
        autoAlpha: 0,
        y: 18,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
      });

      statValues.forEach((el) => {
        const finalValue = Number(el.getAttribute("data-value") || "0");
        if (Number.isNaN(finalValue)) return;

        const counter = { value: 0 };
        gsap.to(counter, {
          value: finalValue,
          duration: 1.2,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = String(Math.floor(counter.value));
          },
        });
      });

      gsap.from(".progress-bar-inner", {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1,
        delay: 0.25,
        ease: "expo.out",
      });
    });

    onCardMouseEnterRef.current = safe((e: React.MouseEvent<HTMLDivElement>) => {
      if (reduceMotionRef.current) return;

      const card = e.currentTarget;
      const icon = card.querySelector(".widget-icon");
      const bgIcon = card.querySelector(".bg-icon");

      gsap.to(card, {
        y: -3,
        borderColor: "rgba(255, 255, 255, 0.2)",
        backgroundColor: "rgba(24, 24, 27, 0.6)",
        duration: 0.28,
        ease: "power2.out",
        overwrite: "auto",
      });

      if (icon) {
        gsap.to(icon, {
          scale: 1.14,
          color: "#fff",
          duration: 0.28,
          ease: "power2.out",
          overwrite: "auto",
        });
      }

      if (bgIcon) {
        gsap.to(bgIcon, {
          scale: 1.06,
          rotation: 4,
          opacity: 0.15,
          duration: 0.35,
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
      onCardMouseEnterRef.current = () => {};
      onCardMouseLeaveRef.current = () => {};
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
          <div className="bg-icon absolute top-0 right-0 p-4 opacity-5 transition-opacity">
            <LayoutGrid className="h-24 w-24 -mr-8 -mt-8" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
              Active Projects
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
              <Progress
                value={(stats.totalProjects / stats.quotas.maxProjects) * 100}
                className="h-1"
              />
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                {Math.round((stats.totalProjects / stats.quotas.maxProjects) * 100)}% Capacity used
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
          <div className="bg-icon absolute top-0 right-0 p-4 opacity-5 transition-opacity">
            <Users className="h-24 w-24 -mr-8 -mt-8" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
              Total Members
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
              <Progress
                value={(stats.totalMembers / stats.quotas.maxMembers) * 100}
                className="h-1 bg-zinc-800"
              />
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                  {stats.pendingInvites > 0 ? `+${stats.pendingInvites} Pending` : "Plan limit"}
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
          <div className="bg-icon absolute top-0 right-0 p-4 opacity-5 transition-opacity">
            <Shield className="h-24 w-24 -mr-8 -mt-8" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
              RBAC Roles
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
            <p className="text-xs text-zinc-500 mt-1">
              Custom profiles defined
            </p>
          </CardContent>
        </Card>
      </div>

      <div
        className="analytics-card"
        onMouseEnter={(e) => onCardMouseEnterRef.current(e)}
        onMouseLeave={(e) => onCardMouseLeaveRef.current(e)}
      >
        <Card className="bg-zinc-900/50 border-zinc-800 transition-colors group relative overflow-hidden">
          <div className="bg-icon absolute top-0 right-0 p-4 opacity-5 transition-opacity">
            <Database className="h-24 w-24 -mr-8 -mt-8" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
              Database Instances
            </CardTitle>
            <Database className="widget-icon h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">Active</div>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="progress-bar-inner h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] origin-left"
                  style={{ width: "100%" }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Stable</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
