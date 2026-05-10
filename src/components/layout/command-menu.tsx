"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { 
  Search, 
  LayoutDashboard, 
  Users, 
  Settings, 
  FolderKanban, 
  Terminal,
  Copy,
  Moon,
  ShieldCheck,
  CreditCard,
  ArrowRight
} from "lucide-react";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

gsap.registerPlugin(useGSAP);

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Navigation");
  
  const popupRef = React.useRef<HTMLDivElement>(null);
  const backdropRef = React.useRef<HTMLDivElement>(null);

  // Extract org slug from pathname: /org/[slug]/...
  const pathParts = pathname.split("/");
  const isOrgContext = pathParts[1] === "org";
  const orgSlug = isOrgContext ? pathParts[2] : null;

  // Keyboard shortcut listener
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Animations
  useGSAP(() => {
    if (open) {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Backdrop animation
        if (backdropRef.current) {
          gsap.fromTo(backdropRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.2, ease: "power2.out" }
          );
        }

        // Popup animation (Raycast-style elastic)
        if (popupRef.current) {
          gsap.fromTo(popupRef.current,
            { opacity: 0, scale: 0.96, y: -20 },
            { 
              opacity: 1, 
              scale: 1, 
              y: 0, 
              duration: 0.3, 
              ease: "back.out(1.2)",
              delay: 0.05
            }
          );

          // Stagger items
          gsap.from(".cmd-item", {
            opacity: 0,
            x: -10,
            duration: 0.2,
            stagger: 0.03,
            delay: 0.15,
            ease: "power2.out"
          });
        }
      });
      return () => mm.revert();
    }
  }, [open]);

  const navigate = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  const copyOrgId = () => {
    if (orgSlug) {
      navigator.clipboard.writeText(orgSlug); // Using slug as ID for this mock
      toast.success("Organization Slug copied to clipboard");
      setOpen(false);
    }
  };

  interface BaseMenuItem {
    icon: React.ElementType;
    label: string;
    disabled: boolean;
  }

  interface UrlMenuItem extends BaseMenuItem {
    url: string;
    action?: never;
  }

  interface ActionMenuItem extends BaseMenuItem {
    action: () => void;
    url?: never;
  }

  type MenuItem = UrlMenuItem | ActionMenuItem;

  interface MenuGroup {
    label: string;
    items: MenuItem[];
  }

  const menuGroups: MenuGroup[] = [
    {
      label: "Navigation",
      items: [
        { icon: LayoutDashboard, label: t("dashboard"), url: `/org/${orgSlug}/dashboard`, disabled: !orgSlug },
        { icon: FolderKanban, label: t("projects"), url: `/org/${orgSlug}/projects`, disabled: !orgSlug },
        { icon: Users, label: t("members"), url: `/org/${orgSlug}/members`, disabled: !orgSlug },
        { icon: Terminal, label: t("playground"), url: `/org/${orgSlug}/developers/playground`, disabled: !orgSlug },
      ]
    },
    {
      label: "Organization",
      items: [
        { icon: Settings, label: t("settings"), url: `/org/${orgSlug}/settings`, disabled: !orgSlug },
        { icon: ShieldCheck, label: "Security", url: `/org/${orgSlug}/settings/security`, disabled: !orgSlug },
        { icon: CreditCard, label: "Billing", url: `/org/${orgSlug}/settings/billing`, disabled: !orgSlug },
      ]
    },
    {
      label: "Actions",
      items: [
        { icon: Copy, label: "Copy Org ID", action: copyOrgId, disabled: !orgSlug },
        { icon: Moon, label: "Toggle Theme", action: () => toast.info("Theme switching coming soon"), disabled: false },
      ]
    }
  ];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop 
          ref={backdropRef}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" 
        />
        <Dialog.Popup
          ref={popupRef}
          className="fixed top-[15%] left-1/2 z-50 w-full max-w-[640px] -translate-x-1/2 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl outline-none ring-1 ring-white/10"
        >
          <div className="flex items-center border-b border-zinc-800 px-4 py-3">
            <Search className="mr-3 h-5 w-5 text-zinc-500" />
            <input
              autoFocus
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-lg text-zinc-100 placeholder-zinc-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border border-zinc-700">
              ESC
            </div>
          </div>

        <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800">
          {menuGroups.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              <h3 className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                    <button
                      key={item.label}
                      disabled={item.disabled}
                      onClick={() => ("url" in item && item.url ? navigate(item.url) : item.action?.())}
                      className={cn(
                        "cmd-item group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                        item.disabled 
                          ? "opacity-50 cursor-not-allowed grayscale" 
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
                      )}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800/50 group-hover:bg-zinc-700/50 transition-colors">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      {!item.disabled && (
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0 transition-all duration-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/50 px-4 py-3 text-xs text-zinc-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-zinc-800 px-1 font-sans text-[10px]">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-zinc-800 px-1 font-sans text-[10px]">↵</kbd> Select
              </span>
            </div>
            <div className="font-medium text-zinc-600">
              SaaS v0.1.0
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
