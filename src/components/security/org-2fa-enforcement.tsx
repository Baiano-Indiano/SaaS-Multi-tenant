"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toggle2FAEnforcementAction } from "@/app/actions/security";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Org2FAEnforcementProps {
  organizationId: string;
  initialEnabled: boolean;
  initialGracePeriodDays: number | null;
}

export function Org2FAEnforcement({ organizationId, initialEnabled, initialGracePeriodDays }: Org2FAEnforcementProps) {
  const t = useTranslations("Settings.security");
  const [enabled, setEnabled] = useState(initialEnabled);
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(initialGracePeriodDays ?? 3);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsPending(true);
    try {
      const result = await toggle2FAEnforcementAction(organizationId, checked, checked ? gracePeriodDays : null);
      if (result.success) {
        setEnabled(checked);
        toast.success(
          checked 
            ? t("enforceEnabledToast") 
            : t("enforceDisabledToast")
        );
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t("enforceErrorToast"));
    } finally {
      setIsPending(false);
    }
  };

  const handleGraceChange = async (days: number) => {
    const val = Math.min(Math.max(days, 0), 30);
    setGracePeriodDays(val);
    if (!enabled) return;
    setIsPending(true);
    try {
      const result = await toggle2FAEnforcementAction(organizationId, true, val);
      if (result.success) {
        toast.success("Período de carência de MFA atualizado com sucesso!");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t("enforceErrorToast"));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="bg-zinc-950/40 border-zinc-900 shadow-xl overflow-hidden">
      <CardHeader className="border-b border-zinc-900 bg-zinc-900/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <ShieldAlert className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-zinc-100">{t("global2faEnforcement")}</CardTitle>
            <CardDescription className="text-zinc-500">
              {t("global2faEnforcementDesc")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="enforce-2fa" className="text-zinc-200 font-medium">
              {t("require2faLabel")}
            </Label>
            <p className="text-sm text-zinc-500 max-w-md">
              {t("require2faHelp")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isPending && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
            <Switch
              id="enforce-2fa"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={isPending}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>

        <AnimatePresence initial={false}>
          {enabled && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 24 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="pt-6 border-t border-zinc-900 space-y-3 overflow-hidden"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="grace-period" className="text-zinc-300 font-medium text-xs">
                  Período de Carência (Dias)
                </Label>
                <p className="text-xs text-zinc-500">
                  Prazo de tolerância para usuários configurarem MFA a partir de seu login antes que seu acesso à organização seja restringido.
                </p>
                <div className="flex items-center gap-4 mt-1.5">
                  <input
                    id="grace-period"
                    type="number"
                    min={0}
                    max={30}
                    value={gracePeriodDays}
                    onChange={(e) => handleGraceChange(parseInt(e.target.value) ?? 3)}
                    disabled={isPending}
                    className="w-20 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-zinc-200 text-xs font-semibold focus:outline-none focus:border-zinc-700"
                  />
                  <span className="text-xs text-zinc-400">
                    {gracePeriodDays === 0 ? "Bloqueio imediato" : `${gracePeriodDays} dias de tolerância`}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
