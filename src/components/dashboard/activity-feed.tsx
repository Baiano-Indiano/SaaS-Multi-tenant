"use client";

import * as React from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

gsap.registerPlugin(useGSAP);

const activities = [
  { id: 1, user: "JD", name: "John Doe", action: "created a new project", time: "2 hours ago" },
  { id: 2, user: "AS", name: "Alice Smith", action: "invited a new member", time: "4 hours ago" },
  { id: 3, user: "RB", name: "Robert Brown", action: "updated organization settings", time: "5 hours ago" },
  { id: 4, user: "ML", name: "Maria Lopez", action: "deleted a project", time: "1 day ago" },
];

export function ActivityFeed() {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

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
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="activity-item flex items-center gap-4 group">
          <Avatar className="h-8 w-8 border border-zinc-800 bg-zinc-900">
            <AvatarFallback className="text-[10px] text-zinc-400 font-bold">
              {activity.user}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-zinc-200 leading-none">
              {activity.name} <span className="text-zinc-500 font-normal">{activity.action}</span>
            </p>
            <p className="text-xs text-zinc-500">
              {activity.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
