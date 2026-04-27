"use client";

import { Check, Copy, Download, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface BackupCodesDisplayProps {
  codes: string[];
}

export function BackupCodesDisplay({ codes }: BackupCodesDisplayProps) {
  const t = useTranslations("Security");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    toast.success(t("backupCodesCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCodes = () => {
    const element = document.createElement("a");
    const file = new Blob([codes.join("\n")], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "backup-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(t("backupCodesDownloaded"));
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Alert variant="destructive" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
        <ShieldAlert className="h-4 w-4 text-amber-500" />
        <AlertTitle className="font-bold">{t("saveBackupCodes")}</AlertTitle>
        <AlertDescription className="text-zinc-400">
          {t("backupCodesWarning")}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-2 p-4 bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-sm">
        {codes.map((code, index) => (
          <div key={index} className="text-zinc-300">
            {code}
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={copyToClipboard}
          className="flex-1 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-100"
        >
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {t("copy")}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={downloadCodes}
          className="flex-1 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-100"
        >
          <Download className="mr-2 h-4 w-4" />
          {t("download")}
        </Button>
      </div>
    </div>
  );
}
