"use client";

import * as React from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Settings, FolderKanban, UserCog, Terminal } from "lucide-react";
import { OrgSwitcher } from "@/components/org-switcher";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("Navigation");
  const activeOrg = organizations.find((o) => o.id === activeOrgId);
  const activeSlug = activeOrg?.slug || "";

  const menuItems = [
    {
      title: t("dashboard"),
      url: `/org/${activeSlug}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      title: t("projects"),
      url: `/org/${activeSlug}/projects`,
      icon: FolderKanban,
    },
    {
      title: t("members"),
      url: `/org/${activeSlug}/members`,
      icon: Users,
    },
    {
      title: t("settings"),
      url: `/org/${activeSlug}/settings`,
      icon: Settings,
    },
    {
      title: t("playground"),
      url: `/org/${activeSlug}/developers/playground`,
      icon: Terminal,
    },
  ];

  const containerRef = React.useRef<HTMLDivElement>(null);
  const reduceMotionRef = React.useRef(false);
  const onMouseEnterRef = React.useRef<(e: React.MouseEvent<HTMLAnchorElement>) => void>(() => {});
  const onMouseLeaveRef = React.useRef<(e: React.MouseEvent<HTMLAnchorElement>) => void>(() => {});

  const isRouteActive = (url: string) => {
    // Exact match
    if (pathname === url) return true;
    
    // For nested routes, check if the pathname starts with the url + "/"
    return pathname.startsWith(url + "/");
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

      // Initialize Floating Pill position
      const activeItem = containerRef.current?.querySelector('li:has([data-active="true"])') as HTMLElement;
      const indicator = containerRef.current?.querySelector('.active-indicator');
      if (activeItem && indicator) {
        gsap.set(indicator, {
          y: activeItem.offsetTop,
          opacity: 1
        });
      }
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
            {t("organization")}
          </SidebarGroupLabel>
          <SidebarGroupContent className="relative">
            {/* Floating Pill Indicator */}
            <div 
              className="active-indicator absolute left-2 h-8 rounded-md bg-zinc-800/80 ring-1 ring-zinc-700/50 z-0 pointer-events-none opacity-0"
              style={{ width: "calc(100% - 16px)", top: 0 }}
            />
            
            <SidebarMenu className="px-2 relative z-10 gap-2.5">
              {menuItems.map((item) => {
                const active = isRouteActive(item.url);
                return (
                  <SidebarMenuItem key={item.url} className="sidebar-item">
                    <SidebarMenuButton
                      isActive={active}
                      data-active={active}
                      size="sm"
                      render={
                        <Link
                          href={item.url}
                          className="nav-link"
                          onMouseEnter={(e) => {
                            onMouseEnterRef.current(e);
                            // Animate indicator to this item
                            const target = e.currentTarget.closest('li');
                            if (target && containerRef.current) {
                              const indicator = containerRef.current.querySelector('.active-indicator');
                              if (indicator) {
                                gsap.to(indicator, {
                                  y: target.offsetTop,
                                  opacity: 1,
                                  duration: 0.3,
                                  ease: "power2.out",
                                  overwrite: "auto"
                                });
                              }
                            }
                          }}
                          onMouseLeave={(e) => {
                            onMouseLeaveRef.current(e);
                            // Return indicator to active item or fade out
                            if (containerRef.current) {
                              const indicator = containerRef.current.querySelector('.active-indicator');
                              const activeItem = containerRef.current.querySelector('li:has([data-active="true"])') as HTMLElement;
                              
                              if (indicator) {
                                if (activeItem) {
                                  gsap.to(indicator, {
                                    y: activeItem.offsetTop,
                                    opacity: 1,
                                    duration: 0.4,
                                    ease: "power2.out",
                                    overwrite: "auto"
                                  });
                                } else {
                                  gsap.to(indicator, {
                                    opacity: 0,
                                    duration: 0.3,
                                    overwrite: "auto"
                                  });
                                }
                              }
                            }
                          }}
                        />
                      }
                      className={cn(
                        "transition-colors duration-200",
                        active 
                          ? "text-zinc-50 hover:bg-transparent" 
                          : "text-zinc-400 hover:text-zinc-200"
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

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-4 mb-2">
            {t("user")}
          </SidebarGroupLabel>
          <SidebarGroupContent className="relative">
             {/* Floating Pill Indicator (User Section) */}
             <div 
              className="user-active-indicator absolute left-2 h-8 rounded-md bg-zinc-800/80 ring-1 ring-zinc-700/50 z-0 pointer-events-none opacity-0"
              style={{ width: "calc(100% - 16px)", top: 0 }}
            />
            <SidebarMenu className="px-2 relative z-10 gap-2.5">
              <SidebarMenuItem className="sidebar-item">
                <SidebarMenuButton
                  isActive={pathname.startsWith("/account")}
                  data-active={pathname.startsWith("/account")}
                  size="sm"
                  render={
                    <Link
                      href="/account"
                      className="nav-link"
                      onMouseEnter={(e) => {
                        onMouseEnterRef.current(e);
                        const target = e.currentTarget.closest('li');
                        if (target && containerRef.current) {
                          const indicator = containerRef.current.querySelector('.user-active-indicator');
                          if (indicator) {
                            gsap.to(indicator, {
                              y: target.offsetTop,
                              opacity: 1,
                              duration: 0.3,
                              ease: "power2.out",
                              overwrite: "auto"
                            });
                          }
                        }
                      }}
                      onMouseLeave={(e) => {
                        onMouseLeaveRef.current(e);
                        if (containerRef.current) {
                          const indicator = containerRef.current.querySelector('.user-active-indicator');
                          const activeItem = containerRef.current.querySelector('.user-active-indicator ~ ul li:has([data-active="true"])') as HTMLElement;
                          
                          if (indicator) {
                            if (activeItem) {
                              gsap.to(indicator, {
                                y: activeItem.offsetTop,
                                opacity: 1,
                                duration: 0.4,
                                ease: "power2.out",
                                overwrite: "auto"
                              });
                            } else {
                              gsap.to(indicator, {
                                opacity: 0,
                                duration: 0.3,
                                overwrite: "auto"
                              });
                            }
                          }
                        }
                      }}
                    />
                  }
                  className={cn(
                    "transition-colors duration-200",
                    pathname.startsWith("/account")
                      ? "text-zinc-50 hover:bg-transparent"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <UserCog className={cn("h-4 w-4", pathname.startsWith("/account") ? "text-zinc-50" : "text-zinc-400")} />
                  <span className="text-sm font-medium">{t("accountSettings")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50 p-4">
        <LocaleSwitcher side="top" />
      </SidebarFooter>
    </Sidebar>
  );
}


