"use client";

import { useState } from "react";
import { toggle2FAEnforcementAction } from "@/app/actions/security";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Org2FAEnforcementProps {
  organizationId: string;
  initialEnabled: boolean;
}

export function Org2FAEnforcement({ organizationId, initialEnabled }: Org2FAEnforcementProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsPending(true);
    try {
      const result = await toggle2FAEnforcementAction(organizationId, checked);
      if (result.success) {
        setEnabled(checked);
        toast.success(
          checked 
            ? "2FA enforcement enabled for the organization." 
            : "2FA enforcement disabled."
        );
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to update security policy.");
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
            <CardTitle className="text-zinc-100">Global 2FA Enforcement</CardTitle>
            <CardDescription className="text-zinc-500">
              Require all members to have two-factor authentication enabled to access this organization.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="enforce-2fa" className="text-zinc-200 font-medium">
              Require 2FA for all members
            </Label>
            <p className="text-sm text-zinc-500 max-w-md">
              When enabled, members without 2FA will be blocked from accessing any part of this organization until they set up a TOTP device.
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
      </CardContent>
    </Card>
  );
}
