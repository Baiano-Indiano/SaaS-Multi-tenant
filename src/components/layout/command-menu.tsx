"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, useListOrganizations } from "@/lib/auth/client";
import {
  Search,
  Shield,
  Settings,
  Globe,
  Plus,
  LogOut,
  LayoutDashboard,
  Keyboard,
} from "lucide-react";

export function CommandMenu({ hideTrigger = false }: { hideTrigger?: boolean }) {
  const { data: session } = useSession();
  const { data: orgs } = useListOrganizations();
  const pathname = usePathname();
  const isAuthPage = pathname?.includes("/login") || pathname?.includes("/register") || pathname?.includes("/verify-2fa");
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const keyBufferRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const params = useParams();
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const orgSlug = params?.orgSlug as string | undefined;

  const items = [
    {
      icon: <LayoutDashboard className="h-4 w-4 text-emerald-500" />,
      label: "Ir para o Painel",
      subtitle: "Dashboard principal do inquilino",
      shortcut: "G D",
      action: () => {
        if (orgSlug) {
          router.push(`/org/${orgSlug}/dashboard`);
        } else if (orgs && orgs.length > 0) {
          const activeOrg = orgs.find((o) => o.id === session?.session?.activeOrganizationId);
          if (activeOrg) {
            router.push(`/org/${activeOrg.slug}/dashboard`);
          } else if (orgs.length === 1) {
            router.push(`/org/${orgs[0].slug}/dashboard`);
          } else {
            router.push("/selecionar-org");
          }
        } else {
          router.push("/dashboard");
        }
      },
    },
    {
      icon: <Shield className="h-4 w-4 text-amber-500" />,
      label: "Configurações de Segurança (MFA)",
      subtitle: "Configurar carência de TOTP e chaves de segurança",
      shortcut: "G S",
      action: () => {
        if (orgSlug) router.push(`/org/${orgSlug}/settings/security`);
      },
    },
    {
      icon: <Settings className="h-4 w-4 text-blue-500" />,
      label: "Gerenciar Integrações (Webhooks)",
      subtitle: "Logs de webhooks externos e retentativas",
      shortcut: "G I",
      action: () => {
        if (orgSlug) router.push(`/org/${orgSlug}/settings/integrations`);
      },
    },
    {
      icon: <Globe className="h-4 w-4 text-zinc-400" />,
      label: "Alterar idioma para Inglês",
      subtitle: "Mudar interface para EN",
      shortcut: "L E",
      action: () => {
        const path = window.location.pathname.replace(/^\/(pt|en)/, "/en");
        router.push(path);
      },
    },
    {
      icon: <Globe className="h-4 w-4 text-zinc-400" />,
      label: "Alterar idioma para Português",
      subtitle: "Mudar interface para PT",
      shortcut: "L P",
      action: () => {
        const path = window.location.pathname.replace(/^\/(pt|en)/, "/pt");
        router.push(path);
      },
    },
    {
      icon: <Plus className="h-4 w-4 text-zinc-400" />,
      label: "Criar Nova Organização",
      subtitle: "Adicionar outro inquilino B2B",
      shortcut: "N O",
      action: () => router.push("/org/create"),
    },
    {
      icon: <LogOut className="h-4 w-4 text-rose-500" />,
      label: "Sair",
      subtitle: "Encerrar sessão de usuário",
      shortcut: "⌥ L",
      action: () => router.push("/logout"),
    },
  ].filter((item) => {
    // Filter out tenant settings if not inside a tenant slug context
    if (!orgSlug && (item.label.includes("MFA") || item.label.includes("Integrações"))) {
      return false;
    }
    return true;
  });

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  // Global sequential hotkey listener
  useEffect(() => {
    if (!session?.user || isAuthPage) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      // Toggle menu with CMD+K / CTRL+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }

      // Ignore text input fields for routing shortcuts
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key.length !== 1 || !/[a-z0-9]/.test(key)) {
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      const newBuffer = (keyBufferRef.current + key).slice(-2); // keep last 2 chars
      keyBufferRef.current = newBuffer;

      let matched = false;
      if (newBuffer === "gd") {
        if (orgSlug) {
          router.push(`/org/${orgSlug}/dashboard`);
        } else if (orgs && orgs.length > 0) {
          const activeOrg = orgs.find((o) => o.id === session?.session?.activeOrganizationId);
          if (activeOrg) {
            router.push(`/org/${activeOrg.slug}/dashboard`);
          } else if (orgs.length === 1) {
            router.push(`/org/${orgs[0].slug}/dashboard`);
          } else {
            router.push("/selecionar-org");
          }
        } else {
          router.push("/dashboard");
        }
        matched = true;
      } else if (newBuffer === "gs" && orgSlug) {
        router.push(`/org/${orgSlug}/settings/security`);
        matched = true;
      } else if (newBuffer === "gi" && orgSlug) {
        router.push(`/org/${orgSlug}/settings/integrations`);
        matched = true;
      } else if (newBuffer === "le") {
        const path = window.location.pathname.replace(/^\/(pt|en)/, "/en");
        router.push(path);
        matched = true;
      } else if (newBuffer === "lp") {
        const path = window.location.pathname.replace(/^\/(pt|en)/, "/pt");
        router.push(path);
        matched = true;
      } else if (newBuffer === "no") {
        router.push("/org/create");
        matched = true;
      }

      if (matched) {
        keyBufferRef.current = "";
      } else {
        timeoutRef.current = setTimeout(() => {
          keyBufferRef.current = "";
        }, 1000);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [orgSlug, router, session?.user, isAuthPage, orgs, session?.session?.activeOrganizationId]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setSearch("");
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };
    window.addEventListener("toggle-command-menu", handleToggle);
    return () => {
      window.removeEventListener("toggle-command-menu", handleToggle);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  if (!session?.user || isAuthPage) {
    return null;
  }

  return (
    <>
      {/* Visual Indicator Hint in UI */}
      {!hideTrigger && (
        <button
          onClick={() => setIsOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          aria-label="Abrir menu de comando"
        >
          <Search className="h-3 w-3" />
          <span>Buscar comandos...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-zinc-800 bg-zinc-950 px-1.5 font-mono text-[10px] font-medium text-zinc-500 opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Menu Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              ref={menuRef}
              className="relative w-full max-w-lg overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/95 shadow-2xl backdrop-blur-md flex flex-col mx-4"
            >
              <div className="flex items-center border-b border-zinc-800/80 px-4 py-3 bg-zinc-950/40">
                <Search className="h-4 w-4 text-zinc-500 mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Digite um comando para pesquisar..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-500 outline-none border-none py-1"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 rounded cursor-pointer"
                >
                  ESC
                </button>
              </div>

              <div className="max-h-[250px] overflow-y-auto p-2 space-y-1">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-6 text-sm text-zinc-500">
                    Nenhum comando encontrado para &ldquo;{search}&rdquo;.
                  </div>
                ) : (
                  filteredItems.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.action();
                          setIsOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-100 cursor-pointer ${
                          isSelected
                            ? "bg-zinc-900 border border-zinc-800 text-zinc-100"
                            : "bg-transparent border border-transparent text-zinc-400"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-md ${
                            isSelected ? "bg-zinc-950 border border-zinc-800" : "bg-zinc-900/50"
                          }`}>
                            {item.icon}
                          </div>
                          <div>
                            <div className="text-xs font-semibold">{item.label}</div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">{item.subtitle}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[9px] text-zinc-500 bg-zinc-950 border border-zinc-800/80 px-1.5 py-0.5 rounded">
                          <Keyboard className="h-2.5 w-2.5" />
                          <span>{item.shortcut}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Sequential Keycaps Cheat Sheet Footer */}
              <div className="border-t border-zinc-800/80 p-3 bg-zinc-950/80 flex flex-col gap-2">
                <div className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                  Guia Rápido de Atalhos (G + Tecla)
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <kbd className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 font-mono text-[9px] text-zinc-300 shadow-sm shadow-black/20">G</kbd>
                    <span className="text-zinc-600 font-bold">+</span>
                    <kbd className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 font-mono text-[9px] text-zinc-300 shadow-sm shadow-black/20">D</kbd>
                    <span className="text-zinc-500 text-[9px]">Painel</span>
                  </div>
                  {orgSlug && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <kbd className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 font-mono text-[9px] text-zinc-300 shadow-sm shadow-black/20">G</kbd>
                        <span className="text-zinc-600 font-bold">+</span>
                        <kbd className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 font-mono text-[9px] text-zinc-300 shadow-sm shadow-black/20">S</kbd>
                        <span className="text-zinc-500 text-[9px]">Segurança</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <kbd className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 font-mono text-[9px] text-zinc-300 shadow-sm shadow-black/20">G</kbd>
                        <span className="text-zinc-600 font-bold">+</span>
                        <kbd className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 font-mono text-[9px] text-zinc-300 shadow-sm shadow-black/20">I</kbd>
                        <span className="text-zinc-500 text-[9px]">Webhooks</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-1.5">
                    <kbd className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 font-mono text-[9px] text-zinc-300 shadow-sm shadow-black/20">L</kbd>
                    <span className="text-zinc-600 font-bold">+</span>
                    <kbd className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 font-mono text-[9px] text-zinc-300 shadow-sm shadow-black/20">E</kbd>
                    <span className="text-zinc-500 text-[9px]">EN</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 font-mono text-[9px] text-zinc-300 shadow-sm shadow-black/20">L</kbd>
                    <span className="text-zinc-600 font-bold">+</span>
                    <kbd className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 font-mono text-[9px] text-zinc-300 shadow-sm shadow-black/20">P</kbd>
                    <span className="text-zinc-500 text-[9px]">PT</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800/80 px-4 py-2 text-[10px] text-zinc-500 bg-zinc-950/40">
                <div className="flex gap-3">
                  <span>↑↓ Navegar</span>
                  <span>↵ Executar</span>
                </div>
                <span>Atalho Global: ⌘K / Ctrl+K</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export function CommandMenuTrigger() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAuthPage = pathname?.includes("/login") || pathname?.includes("/register") || pathname?.includes("/verify-2fa");

  if (!session?.user || isAuthPage) {
    return null;
  }

  const handleClick = () => {
    window.dispatchEvent(new Event("toggle-command-menu"));
  };

  return (
    <button
      onClick={handleClick}
      className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
      aria-label="Abrir menu de comando"
    >
      <Search className="h-3 w-3" />
      <span>Buscar comandos...</span>
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-zinc-800 bg-zinc-950 px-1.5 font-mono text-[10px] font-medium text-zinc-500 opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}
