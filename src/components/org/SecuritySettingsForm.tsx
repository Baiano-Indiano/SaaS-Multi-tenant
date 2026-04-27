"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toggle2FAEnforcementAction } from "@/app/actions/security";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface SecuritySettingsFormProps {
  organizationId: string;
  require2FA: boolean;
}

export function SecuritySettingsForm({ 
  organizationId, 
  require2FA: initialRequire2FA 
}: SecuritySettingsFormProps) {
  const t = useTranslations("Settings.security");
  const [isEnforced, setIsEnforced] = useState(initialRequire2FA);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      const result = await toggle2FAEnforcementAction(organizationId, checked);
      if (result.success) {
        setIsEnforced(checked);
        toast.success(
          checked 
            ? t("enabledSuccess") 
            : t("disabledSuccess")
        );
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t("updateError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-zinc-950/40 border-zinc-900 shadow-xl overflow-hidden">
      <CardHeader className="border-b border-zinc-900/50 bg-zinc-900/20">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              {t("title")}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t("description")}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 font-mono text-[10px]">
            {t("badge")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="2fa-enforcement" className="text-zinc-200 font-semibold">
              {t("twoFactorTitle")}
            </Label>
            <p className="text-sm text-zinc-500 max-w-[400px]">
              {t("twoFactorDescription")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
            <Switch
              id="2fa-enforcement"
              checked={isEnforced}
              onCheckedChange={handleToggle}
              disabled={isLoading}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
        </div>

        {!isEnforced && (
          <div className="mt-6 p-4 rounded-lg bg-amber-500/5 border border-amber-500/10 flex gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="text-xs text-amber-500/80 leading-relaxed">
              <p className="font-bold uppercase tracking-wider mb-1">{t("warningTitle")}</p>
              {t("warningDescription")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
