"use client";

import { useState } from "react";
import { Shield, Database, Check, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { saveAuditExportConfig } from "@/lib/actions/audit-export";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AuditExportConfig {
  id: string;
  type: string;
  bucketName: string;
  region: string | null;
  endpoint: string | null;
  accessKeyId: string | null;
  secretAccessKey: string | null;
  isActive: boolean;
  lastExportAt: Date | null;
}

interface AuditLogExportSettingsProps {
  organizationId: string;
  initialConfig: AuditExportConfig | null;
}

export function AuditLogExportSettings({ 
  organizationId, 
  initialConfig 
}: AuditLogExportSettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(initialConfig?.isActive ?? false);
  const [config, setConfig] = useState({
    bucketName: initialConfig?.bucketName ?? "",
    region: initialConfig?.region ?? "us-east-1",
    endpoint: initialConfig?.endpoint ?? "",
    accessKeyId: initialConfig?.accessKeyId ?? "",
    secretAccessKey: initialConfig?.secretAccessKey ?? "",
  });

  const handleSave = async () => {
    if (!config.bucketName || !config.accessKeyId || !config.secretAccessKey) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const result = await saveAuditExportConfig({
        organizationId,
        ...config,
        isActive: enabled,
      });

      if (result.success) {
        toast.success("Audit export configuration saved and verified.");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to save configuration.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-950 border-zinc-900 overflow-hidden shadow-2xl">
        <CardHeader className="border-b border-zinc-900 bg-zinc-900/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Database className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-zinc-100">SIEM Audit Log Export (S3)</CardTitle>
                <CardDescription className="text-xs text-zinc-500 mt-0.5">
                  Automated daily batch exports of security events to your infrastructure.
                </CardDescription>
              </div>
            </div>
            <Switch 
              checked={enabled} 
              onCheckedChange={setEnabled}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="bucket" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Bucket Name</Label>
              <Input 
                id="bucket" 
                placeholder="my-org-audit-logs" 
                className="bg-zinc-900/50 border-zinc-800 text-zinc-200 h-10 focus:ring-emerald-500/20"
                value={config.bucketName}
                onChange={(e) => setConfig({ ...config, bucketName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="region" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Region</Label>
              <Input 
                id="region" 
                placeholder="us-east-1" 
                className="bg-zinc-900/50 border-zinc-800 text-zinc-200 h-10 focus:ring-emerald-500/20"
                value={config.region}
                onChange={(e) => setConfig({ ...config, region: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Endpoint URL (S3-Compatible)</Label>
              <Input 
                id="endpoint" 
                placeholder="https://s3.amazonaws.com" 
                className="bg-zinc-900/50 border-zinc-800 text-zinc-200 h-10 focus:ring-emerald-500/20"
                value={config.endpoint}
                onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
              />
              <p className="text-[10px] text-zinc-500 italic">Leave blank for AWS S3. Required for Cloudflare R2, MinIO, or DigitalOcean.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessKey" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Access Key ID</Label>
              <Input 
                id="accessKey" 
                placeholder={initialConfig?.accessKeyId === "********" ? "Keep current key" : "AKIA..."}
                className="bg-zinc-900/50 border-zinc-800 text-zinc-200 h-10 focus:ring-emerald-500/20"
                value={config.accessKeyId === "********" ? "" : config.accessKeyId}
                onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="secretKey" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Secret Access Key</Label>
              <Input 
                id="secretKey" 
                type="password"
                placeholder={initialConfig?.secretAccessKey === "********" ? "Keep current secret" : "Enter secret key"}
                className="bg-zinc-900/50 border-zinc-800 text-zinc-200 h-10 focus:ring-emerald-500/20"
                value={config.secretAccessKey === "********" ? "" : config.secretAccessKey}
                onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <Alert className="bg-emerald-500/5 border-emerald-500/10 text-emerald-400/80 rounded-xl">
              <Shield className="h-4 w-4" />
              <AlertTitle className="text-xs font-bold uppercase tracking-tight">SIEM Compliance Ready</AlertTitle>
              <AlertDescription className="text-[11px] leading-relaxed mt-1 opacity-90">
                Audit logs are exported in a flat JSON structure at <strong>00:00 UTC daily</strong>. 
                Credentials are encrypted using AES-256-GCM. 
                Real-time streaming can be configured separately via <a href="./connectivity" className="underline hover:text-emerald-300">Webhooks</a> using the <code>audit.log_created</code> trigger.
              </AlertDescription>
            </Alert>

            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all duration-200 shadow-lg shadow-emerald-900/20"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save & Verify Integration
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {initialConfig?.lastExportAt && (
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/30 border border-zinc-900 rounded-lg w-fit">
          <Info className="h-3 w-3 text-zinc-500" />
          <p className="text-[10px] text-zinc-500">
            Last successful export: <span className="text-zinc-400 font-medium">{new Date(initialConfig.lastExportAt).toLocaleString()}</span>
          </p>
        </div>
      )}
    </div>
  );
}
