"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TwoFactorStatusProps {
  enabled: boolean;
}

export function TwoFactorStatus({ enabled }: TwoFactorStatusProps) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold text-zinc-100">
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Add an extra layer of security to your account.
          </CardDescription>
        </div>
        {enabled ? (
          <ShieldCheck className="h-8 w-8 text-emerald-500" />
        ) : (
          <ShieldAlert className="h-8 w-8 text-amber-500" />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-400">Status:</span>
          <Badge 
            variant={enabled ? "default" : "secondary"}
            className={enabled ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}
          >
            {enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
