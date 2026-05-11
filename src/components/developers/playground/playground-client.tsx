"use client";

import { useState, useTransition, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Key, 
  Loader2, 
  Terminal,
  Zap,
  Lock,
  Settings2,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations, useFormatter } from "next-intl";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";
import { createApiKeyAction } from "@/app/actions/api-keys";
import gsap from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import { GsapEntrance } from "@/components/ui/gsap-entrance";

interface PlaygroundClientProps {
  orgId: string;
  orgSlug: string;
  adminRoleId: string | null;
  existingKeys: { id: string; name: string }[];
  openApiSpec: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function PlaygroundClient({ 
  orgId, 
  orgSlug, 
  adminRoleId,
  openApiSpec
}: PlaygroundClientProps) {
  const t = useTranslations("Playground");
  const format = useFormatter();
  const [apiKey, setApiKey] = useState<string>("");
  const [manualKey, setManualKey] = useState<string>("");
  const [isManual, setIsManual] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showSuccessGlow, setShowSuccessGlow] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleGenerateKey = () => {
    if (!adminRoleId) {
      toast.error(t("noRoleError"));
      return;
    }

    startTransition(async () => {
      const result = await createApiKeyAction({
        name: t("keyName", { date: format.dateTime(new Date(), { month: 'short', day: 'numeric', year: 'numeric' }) }),
        orgId,
        orgSlug,
        roleId: adminRoleId!,
        expiresInDays: 1,
      });

      if (result.success && result.rawKey) {
        setApiKey(result.rawKey);
        setIsManual(false);
        setShowSuccessGlow(true);
        setTimeout(() => setShowSuccessGlow(false), 2000);
        toast.success(t("keyInjected"));
      } else {
        toast.error(t("failedToGenerate"));
      }
    });
  };

  const activeKeyDisplay = apiKey || manualKey;

  // Magnetic button effect logic
  const handleMagneticMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const { left, top, width, height } = btn.getBoundingClientRect();
    const x = e.clientX - (left + width / 2);
    const y = e.clientY - (top + height / 2);
    
    gsap.to(btn, {
      x: x * 0.3,
      y: y * 0.3,
      duration: 0.4,
      ease: "power2.out"
    });
  };

  const handleMagneticReset = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: "elastic.out(1, 0.3)"
    });
  };

  return (
    <div ref={containerRef} className="flex flex-col space-y-8 pb-20 relative">
      {/* SUCCESS GLOW OVERLAY */}
      <AnimatePresence>
        {showSuccessGlow && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-[1px]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_50px_rgba(16,185,129,0.5)] animate-scan" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUBTLE BREADCRUMB HEADER */}
      <GsapEntrance type="apple" stagger={0.05} className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-widest">
              <span>{orgSlug}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-zinc-400">{t("title")}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-500" />
              API Explorer
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 p-1.5 rounded-xl shadow-inner-white">
              <AnimatePresence mode="wait">
                {!activeKeyDisplay && !isManual ? (
                  <motion.div
                    key="action"
                    initial={{ opacity: 0, filter: "blur(4px)", scale: 0.9 }}
                    animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                    exit={{ opacity: 0, filter: "blur(4px)", scale: 0.9 }}
                    transition={{ duration: 0.3, ease: "circOut" }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerateKey}
                      onMouseMove={handleMagneticMove}
                      onMouseLeave={handleMagneticReset}
                      disabled={isPending}
                      className="h-9 text-xs font-semibold text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/5 gap-2 px-4 rounded-lg relative overflow-hidden"
                    >
                      {isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Zap className="w-3 h-3" />
                      )}
                      {t("createKey")}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="status"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 px-3 py-1"
                  >
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter leading-none mb-1">
                        {t("keySelectionLabel")}
                      </span>
                      <span className="text-xs font-mono text-emerald-500 font-medium leading-none flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3" />
                        {isManual ? "manual_key_active" : "temp_key_injected"}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-zinc-800" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-colors"
                      onClick={() => {
                        setApiKey("");
                        setManualKey("");
                        setIsManual(false);
                      }}
                    >
                      <Lock className="w-3 h-3" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="h-6 w-px bg-zinc-800" />
              
              <Button
                variant="ghost"
                size="icon"
                onMouseMove={handleMagneticMove}
                onMouseLeave={handleMagneticReset}
                className={`h-9 w-9 rounded-lg transition-all ${isManual && !apiKey ? "bg-emerald-500/10 text-emerald-500" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"}`}
                onClick={() => setIsManual(!isManual)}
              >
                <Settings2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* MANUAL KEY INPUT (IF ACTIVE) */}
        <AnimatePresence>
          {isManual && !apiKey && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -20 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full group">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    placeholder={t("pasteKey")}
                    value={manualKey}
                    onChange={(e) => setManualKey(e.target.value)}
                    className="h-10 bg-zinc-950 border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/10 pl-10 text-sm font-mono transition-all"
                  />
                </div>
                <Button 
                  size="sm"
                  onMouseMove={handleMagneticMove}
                  onMouseLeave={handleMagneticReset}
                  className="w-full sm:w-auto h-10 px-6 bg-zinc-100 hover:bg-white text-zinc-950 font-bold shadow-lg"
                  onClick={() => {
                    if (manualKey.trim()) {
                      toast.success(t("keyInjected"));
                      setShowSuccessGlow(true);
                      setTimeout(() => setShowSuccessGlow(false), 1500);
                    }
                  }}
                >
                  Apply
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SCALAR API REFERENCE */}
        <div className="border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl bg-zinc-950 group/scalar relative">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover/scalar:opacity-100 transition-opacity duration-1000 pointer-events-none" />
          <div className="scalar-dashboard-theme">
            <ApiReferenceReact
              configuration={{
                content: openApiSpec,
                layout: 'classic',
                theme: 'moon',
                authentication: {
                  preferredSecurityScheme: "bearerAuth",
                  securitySchemes: {
                    bearerAuth: {
                      token: activeKeyDisplay.trim(),
                    },
                  },
                },
                hideDownloadButton: true,
                hideTestRequestButton: false,
                darkMode: true,
                customCss: `
                  :root {
                    --scalar-font-family: inherit;
                    --scalar-color-1: #fafafa;
                    --scalar-color-2: #a1a1aa;
                    --scalar-color-3: #71717a;
                    --scalar-color-accent: #10b981;
                    --scalar-background-1: #09090b;
                    --scalar-background-2: #18181b;
                    --scalar-background-3: #27272a;
                    --scalar-border-color: #27272a;
                  }

                  .scalar-app { background: transparent !important; }
                  .scalar-api-reference { border: none !important; background: transparent !important; }

                  .scalar-sidebar {
                    background: #09090b !important;
                    border-right: 1px solid #18181b !important;
                  }

                  .scalar-header { display: none !important; }

                  .endpoint {
                    background: #0c0c0e !important;
                    border: 1px solid #18181b !important;
                    border-radius: 12px !important;
                    margin-bottom: 24px !important;
                    transition: border-color 0.3s ease !important;
                  }

                  .endpoint:hover {
                    border-color: #27272a !important;
                  }

                  .markdown {
                    font-size: 0.9375rem !important;
                    line-height: 1.6 !important;
                    color: #a1a1aa !important;
                  }
                `
              }}
            />
          </div>
        </div>
      </GsapEntrance>

      <style jsx global>{`
        .shadow-inner-white {
          box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.05);
        }

        @keyframes scan {
          from { transform: translateX(-100%) translateY(0); }
          to { transform: translateX(100%) translateY(100vh); }
        }

        .animate-scan {
          animation: scan 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .scalar-api-reference-main {
          height: auto !important;
          overflow: visible !important;
        }

        .scalar-sidebar {
          height: calc(100vh - 200px) !important;
          position: sticky !important;
          top: 0 !important;
        }
      `}</style>
    </div>
  );
}

