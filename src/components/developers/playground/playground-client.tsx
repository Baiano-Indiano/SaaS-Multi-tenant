"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Key, 
  Loader2, 
  Sparkles, 
  ShieldAlert,
  Terminal
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useFormatter } from "next-intl";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import { createApiKeyAction } from "@/app/actions/api-keys";

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
  existingKeys,
  openApiSpec
}: PlaygroundClientProps) {
  const t = useTranslations("Playground");
  const format = useFormatter();
  const [apiKey, setApiKey] = useState<string>("");
  const [manualKey, setManualKey] = useState<string>("");
  const [isManual, setIsManual] = useState(false);
  const [isPending, startTransition] = useTransition();

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
        toast.success(t("keyInjected"));
      } else {
        toast.error(t("failedToGenerate"));
      }
    });
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Shortcut Header Area */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              <Terminal className="h-6 w-6 text-emerald-400" />
              {t("title")}
            </h1>
            <p className="text-zinc-400">{t("description")}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={handleGenerateKey} 
              disabled={isPending}
              variant="outline"
              className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-100 gap-2 h-10 shadow-lg shadow-primary/5"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-amber-400" />
              )}
              {t("createKey")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Key className="h-4 w-4 text-emerald-400" />
                  {t("keySelectionLabel")}
                </label>
                <button 
                  onClick={() => setIsManual(!isManual)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {isManual ? t("selectKey") : t("manualKey")}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {isManual ? (
                  <motion.div
                    key="manual"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <Input 
                      placeholder={t("pasteKey")}
                      value={manualKey}
                      onChange={(e) => {
                        setManualKey(e.target.value);
                        setApiKey(e.target.value);
                      }}
                      className="bg-zinc-950 border-zinc-800 text-zinc-100 h-10"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <Select 
                      onValueChange={(val) => setApiKey(val ?? "")}
                      value={apiKey}
                    >
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100 h-10">
                        <SelectValue placeholder={t("selectKey")} />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                        {apiKey && !existingKeys.some(k => k.id === apiKey) && (
                          <SelectItem value={apiKey} className="text-emerald-400">
                            {t("testKeyLabel")} ({apiKey.substring(0, 8)}...)
                          </SelectItem>
                        )}
                        {existingKeys.map((key) => (
                          <SelectItem key={key.id} value={key.id}>
                            {t("persistentKeyLabel")}: {key.name}
                          </SelectItem>
                        ))}
                        {existingKeys.length === 0 && !apiKey && (
                          <div className="p-2 text-xs text-zinc-500 italic">
                            No keys found. Generate one above.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Alert className="border-amber-500/20 bg-amber-500/5 text-amber-200">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-500 font-semibold flex items-center gap-2">
              {t("liveWarning")}
            </AlertTitle>
            <AlertDescription className="text-zinc-400 text-xs mt-1">
              {t("liveWarningDescription")}
            </AlertDescription>
          </Alert>
        </div>
      </motion.div>

      {/* Scalar Container */}
      <Card className="flex-1 overflow-hidden border-zinc-800 bg-zinc-950 shadow-2xl relative min-h-[700px]">
        <div className="absolute top-4 right-4 z-50 flex gap-2">
           {/* Future: Documentation toggle or search focus */}
        </div>
        <CardContent className="p-0 h-full">
          <div className="scalar-theme-custom h-full">
            <ApiReferenceReact
              configuration={{
                content: openApiSpec,
                proxyUrl: "",
                authentication: {
                  preferredSecurityScheme: "bearerAuth",
                  securitySchemes: {
                    bearerAuth: {
                      token: apiKey,
                    },
                  },
                },
                theme: "none",
                hideDownloadButton: true,
                hideTestRequestButton: false,
                isEditable: false,
                showSidebar: true,
                searchHotKey: "k",
              }}
            />
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        /* Scalar custom theaming to match Dashboard Zinc-950 */
        .scalar-theme-custom {
          --scalar-font-family: var(--font-sans);
          --scalar-font-code: var(--font-geist-mono);

          /* Backgrounds */
          --scalar-background-1: #09090b; /* zinc-950 */
          --scalar-background-2: #18181b; /* zinc-900 */
          --scalar-background-3: #27272a; /* zinc-800 */
          --scalar-background-accent: rgba(250, 250, 250, 0.05);

          /* Text Colors */
          --scalar-color-1: #fafafa; /* zinc-50 */
          --scalar-color-2: #a1a1aa; /* zinc-400 */
          --scalar-color-3: #71717a; /* zinc-500 */
          --scalar-color-accent: #fafafa; 

          /* Interactive */
          --scalar-button-1: #fafafa;
          --scalar-button-1-color: #09090b;
          --scalar-button-1-hover: #e4e4e7;
          
          /* Sidebar */
          --scalar-sidebar-background-1: #09090b;
          --scalar-sidebar-item-hover-background: #18181b;
          --scalar-sidebar-item-active-background: #27272a;
          
          /* Borders */
          --scalar-border-color: #27272a;

          /* Hide Scalar top branding if any */
          --scalar-header-height: 0px;
        }

        /* Micro-fixes for Scalar UI overlap */
        .scalar-app {
          background-color: transparent !important;
        }
        
        .references-classic .sidebar {
          border-right: 1px solid #27272a !important;
        }

        /* Fade in Scalar */
        .scalar-api-reference {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
