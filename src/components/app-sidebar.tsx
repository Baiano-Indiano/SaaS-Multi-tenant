"use client";

import * as React from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Settings, FolderKanban } from "lucide-react";
import { OrgSwitcher } from "@/components/org-switcher";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  logo?: string | null;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  organizations: Organization[];
  activeOrgId: string | null;
}

export function AppSidebar({ organizations, activeOrgId, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const activeOrg = organizations.find((o) => o.id === activeOrgId);
  const activeSlug = activeOrg?.slug || "";

  const menuItems = [
    {
      title: "Dashboard",
      url: `/org/${activeSlug}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      title: "Projects",
      url: `/org/${activeSlug}/projects`,
      icon: FolderKanban,
    },
    {
      title: "Members",
      url: `/org/${activeSlug}/settings/members`,
      icon: Users,
    },
    {
      title: "Settings",
      url: `/org/${activeSlug}/settings/general`,
      icon: Settings,
    },
  ];

  const containerRef = React.useRef<HTMLDivElement>(null);
  const reduceMotionRef = React.useRef(false);
  const onMouseEnterRef = React.useRef<(e: React.MouseEvent<HTMLAnchorElement>) => void>(() => {});
  const onMouseLeaveRef = React.useRef<(e: React.MouseEvent<HTMLAnchorElement>) => void>(() => {});

  const isRouteActive = (url: string) => {
    // For settings, we want exact match for specific items, but sub-path awareness for the general area
    if (url.includes("/settings/general")) {
      return pathname.includes("/settings") && !pathname.includes("/members") && !pathname.includes("/activity");
    }
    return pathname === url || pathname.startsWith(url + "/");
  };

  useGSAP((_, contextSafe) => {
    if (!containerRef.current) return;
    const safe = contextSafe ?? ((fn: (e: React.MouseEvent<HTMLAnchorElement>) => void) => fn);

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      reduceMotionRef.current = true;
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      reduceMotionRef.current = false;

      gsap.from(".sidebar-item", {
        autoAlpha: 0,
        x: -12,
        duration: 0.55,
        stagger: 0.05,
        ease: "power2.out",
        delay: 0.08,
      });
    });

    onMouseEnterRef.current = safe((e: React.MouseEvent<HTMLAnchorElement>) => {
      if (reduceMotionRef.current) return;

      gsap.to(e.currentTarget, {
        x: 3,
        duration: 0.18,
        ease: "power2.out",
        overwrite: "auto",
      });
    });

    onMouseLeaveRef.current = safe((e: React.MouseEvent<HTMLAnchorElement>) => {
      if (reduceMotionRef.current) return;

      gsap.to(e.currentTarget, {
        x: 0,
        duration: 0.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    });

    return () => {
      mm.revert();
      onMouseEnterRef.current = () => {};
      onMouseLeaveRef.current = () => {};
    };
  }, { scope: containerRef });

  return (
    <Sidebar ref={containerRef} {...props}>
      <SidebarHeader className="border-b border-sidebar-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <OrgSwitcher organizations={organizations} activeOrgId={activeOrgId} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-4 mb-2">
            Organization
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {menuItems.map((item) => {
                const active = isRouteActive(item.url);
                return (
                  <SidebarMenuItem key={item.title} className="sidebar-item">
                    <SidebarMenuButton
                      isActive={active}
                      render={
                        <Link
                          href={item.url}
                          onMouseEnter={(e) => onMouseEnterRef.current(e)}
                          onMouseLeave={(e) => onMouseLeaveRef.current(e)}
                        />
                      }
                      className={cn(
                        "transition-all duration-200",
                        active 
                          ? "bg-zinc-800/50 text-zinc-50 shadow-sm ring-1 ring-zinc-700/50" 
                          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", active ? "text-zinc-50" : "text-zinc-400")} />
                      <span className="text-sm font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

