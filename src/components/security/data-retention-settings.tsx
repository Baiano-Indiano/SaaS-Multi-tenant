"use client";

import { useState } from "react";
import { updateDataRetentionAction } from "@/app/actions/security";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface DataRetentionSettingsProps {
  organizationId: string;
  initialDays: number | null;
}

export function DataRetentionSettings({ organizationId, initialDays }: DataRetentionSettingsProps) {
  const t = useTranslations("Settings.security");
  const router = useRouter();
  
  const [enabled, setEnabled] = useState(initialDays !== null);
  const [days, setDays] = useState<number | "">(initialDays ?? 30);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateDays = (val: number | ""): boolean => {
    if (enabled) {
      if (val === "" || !Number.isInteger(Number(val)) || Number(val) < 7) {
        setError(t("retentionLimitError"));
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      setError(null);
    } else {
      validateDays(days);
    }
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setDays("");
      setError(t("retentionLimitError"));
      return;
    }

    const numVal = parseInt(val, 10);
    setDays(isNaN(numVal) ? "" : numVal);
    
    if (enabled) {
      if (isNaN(numVal) || numVal < 7) {
        setError(t("retentionLimitError"));
      } else {
        setError(null);
      }
    }
  };

  const handleSave = async () => {
    if (enabled && (days === "" || days < 7)) {
      setError(t("retentionLimitError"));
      return;
    }

    setIsPending(true);
    try {
      const finalDays = enabled ? (days as number) : null;
      const result = await updateDataRetentionAction(organizationId, enabled, finalDays);
      
      if (result.success) {
        toast.success(t("retentionSavedToast"));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t("retentionErrorToast"));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="bg-zinc-950/40 border-zinc-900 shadow-xl overflow-hidden">
      <CardHeader className="border-b border-zinc-900 bg-zinc-900/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Clock className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-zinc-100">{t("dataRetentionTitle")}</CardTitle>
            <CardDescription className="text-zinc-500">
              {t("dataRetentionDesc")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="data-retention-switch" className="text-zinc-200 font-medium">
              {t("dataRetentionLabel")}
            </Label>
            <p className="text-sm text-zinc-500 max-w-md">
              {t("dataRetentionHelp")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="data-retention-switch"
              checked={enabled}
              onCheckedChange={handleEnabledChange}
              disabled={isPending}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>

        {enabled && (
          <div className="space-y-2 max-w-xs pt-2">
            <Label htmlFor="retention-days-input" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              {t("retentionDaysLabel")}
            </Label>
            <Input
              id="retention-days-input"
              type="number"
              min={7}
              placeholder="30"
              value={days}
              onChange={handleDaysChange}
              disabled={isPending}
              className="bg-zinc-900/50 border-zinc-800 text-zinc-200 h-10 focus:ring-emerald-500/20"
            />
            {error ? (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            ) : (
              <p className="text-[10px] text-zinc-500 italic">
                {t("retentionDaysHelp")}
              </p>
            )}
          </div>
        )}

        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={isPending || (enabled && error !== null)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all duration-200 shadow-lg shadow-emerald-900/20"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("savingRetention")}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {t("saveRetention")}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
