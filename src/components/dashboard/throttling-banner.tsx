"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, ArrowUpRight, X } from "lucide-react";
import { getThrottlingStatusAction, type ThrottlingStatus } from "@/app/actions/throttling";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ThrottlingBannerProps {
  orgId: string;
}

export function ThrottlingBanner({ orgId }: ThrottlingBannerProps) {
  const [status, setStatus] = useState<ThrottlingStatus | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const params = useParams();
  const orgSlug = params?.orgSlug as string | undefined;

  useEffect(() => {
    let active = true;

    async function fetchStatus() {
      const res = await getThrottlingStatusAction(orgId);
      if (active) {
        setStatus(res);
      }
    }

    fetchStatus();

    // Poll every 30 seconds to update throttling or anomaly status
    const interval = setInterval(fetchStatus, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [orgId]);

  if (!status || !status.isThrottled || !isVisible) {
    return null;
  }

  const isAnomaly = status.reason === "security_anomaly";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden w-full shrink-0"
      >
        <div
          className={`border-b px-6 py-3.5 flex items-center justify-between gap-4 text-xs relative ${
            isAnomaly
              ? "bg-rose-950/20 border-rose-900/40 text-rose-200"
              : "bg-amber-950/20 border-amber-900/40 text-amber-200"
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div
            className={`absolute inset-0 opacity-5 blur-xl pointer-events-none ${
              isAnomaly ? "bg-rose-500" : "bg-amber-500"
            }`}
          />

          <div className="flex items-center gap-3 z-10">
            <div
              className={`p-1.5 rounded-md ${
                isAnomaly ? "bg-rose-950/60 border border-rose-800/40" : "bg-amber-950/60 border border-amber-800/40"
              }`}
            >
              {isAnomaly ? (
                <ShieldAlert className="h-4 w-4 text-rose-400 animate-pulse" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-400 animate-bounce" />
              )}
            </div>
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                {isAnomaly ? "Alerta de Segurança Ativo" : "Limitação de Taxa de Requisição"}
              </span>
              <p className="text-[11px] font-medium opacity-90 leading-normal">
                {isAnomaly
                  ? "Atividade suspeita detectada. O acesso foi restrito preventivamente a 10 requisições por segundo para proteger seus dados."
                  : `Organização no Plano Gratuito (máx: 10 req/s). Tráfego excessivo pode causar rejeições automáticas.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 z-10 shrink-0">
            {isAnomaly ? (
              <Link
                href={orgSlug ? `/org/${orgSlug}/settings/security` : "#"}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-800/50 hover:border-rose-700/50 rounded-lg font-bold text-[10px] uppercase tracking-wider text-rose-200 transition-colors"
              >
                <span>Auditar Logs</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            ) : (
              <Link
                href={orgSlug ? `/org/${orgSlug}/settings/billing` : "#"}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-900/40 hover:bg-amber-900/60 border border-amber-800/50 hover:border-amber-700/50 rounded-lg font-bold text-[10px] uppercase tracking-wider text-amber-200 transition-colors"
              >
                <span>Fazer Upgrade</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 rounded hover:bg-zinc-900/40 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Fechar aviso"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
