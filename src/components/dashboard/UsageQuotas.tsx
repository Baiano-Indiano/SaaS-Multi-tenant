"use client";

import { motion } from "framer-motion";
import { MagneticCard } from "./MagneticCard";
import { Boxes, Users } from "lucide-react";
import { useTranslations } from "next-intl";

interface UsageQuotasProps {
  stats: {
    totalProjects: number;
    totalMembers: number;
    quotas: {
      maxMembers: number;
      maxProjects: number;
    };
  };
}

export function UsageQuotas({ stats }: UsageQuotasProps) {
  const projectPercentage = (stats.totalProjects / stats.quotas.maxProjects) * 100;
  const memberPercentage = (stats.totalMembers / stats.quotas.maxMembers) * 100;
  const t = useTranslations("Dashboard");

  // Technical terminology ignored by the i18n scanner
  const quotaCheckTag = "QUOTA_CHECK_v1.0";

  return (
    <MagneticCard className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-100">{t("usageQuotas.planUsage")}</h3>
        <span className="text-xs font-mono text-zinc-500 px-2 py-1 bg-zinc-900/50 rounded-full border border-zinc-800">
          {quotaCheckTag}
        </span>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-zinc-400">
              <Boxes className="w-4 h-4" />
              <span>{t("usageQuotas.activeProjects")}</span>
            </div>
            <span className="font-mono text-zinc-100">
              {stats.totalProjects} / {stats.quotas.maxProjects}
            </span>
          </div>
          <div className="relative h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${projectPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${
                projectPercentage > 90 
                  ? "bg-red-500" 
                  : projectPercentage > 70 
                  ? "bg-amber-500" 
                  : "bg-emerald-500"
              }`}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-zinc-400">
              <Users className="w-4 h-4" />
              <span>{t("usageQuotas.teamMembers")}</span>
            </div>
            <span className="font-mono text-zinc-100">
              {stats.totalMembers} / {stats.quotas.maxMembers}
            </span>
          </div>
          <div className="relative h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${memberPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className={`h-full rounded-full ${
                memberPercentage > 90 
                  ? "bg-red-500" 
                  : memberPercentage > 70 
                  ? "bg-amber-500" 
                  : "bg-emerald-500"
              }`}
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-800">
        <button className="w-full py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-2 bg-zinc-900/30 rounded-lg border border-zinc-800 hover:border-zinc-700">
          {t("usageQuotas.upgradeToEnterprise")}
        </button>
      </div>
    </MagneticCard>
  );
}
