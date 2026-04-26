"use client";

import { useState, useTransition } from "react";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";
import { openApiSpec } from "@/lib/api/openapi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createApiKeyAction } from "@/app/actions/api-keys";
import { Key, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface PlaygroundClientProps {
  orgId: string;
  orgSlug: string;
  adminRoleId: string | null;
}

export function PlaygroundClient({ orgId, orgSlug, adminRoleId }: PlaygroundClientProps) {
  const [apiKey, setApiKey] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const handleGenerateKey = () => {
    if (!adminRoleId) {
      toast.error("No suitable role found for API key generation.");
      return;
    }

    startTransition(async () => {
      const result = await createApiKeyAction({
        name: `Playground Key (${new Date().toLocaleDateString()})`,
        orgId,
        orgSlug,
        roleId: adminRoleId,
        expiresInDays: 1, // Short lived for security
      });

      if (result.success && result.rawKey) {
        setApiKey(result.rawKey);
        toast.success("Test API Key generated and injected!");
      } else {
        toast.error("Failed to generate API Key");
      }
    });
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Shortcut Header Area */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">API Playground</h1>
          <p className="text-zinc-400">Test our endpoints in real-time with zero friction.</p>
        </div>

        {!apiKey ? (
          <Button 
            onClick={handleGenerateKey} 
            disabled={isPending}
            variant="outline"
            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-100 gap-2 h-11 px-6 shadow-lg shadow-primary/5"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-amber-400" />
            )}
            Create Test Key
          </Button>
        ) : (
          <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm font-mono">
            <Key className="h-3.5 w-3.5" />
            {apiKey.substring(0, 10)}... injected
          </div>
        )}
      </motion.div>

      {/* Scalar Container */}
      <Card className="flex-1 overflow-hidden border-zinc-800 bg-zinc-950 shadow-2xl">
        <CardContent className="p-0 h-full">
          <div className="scalar-theme-custom h-full min-h-[600px]">
            <ApiReferenceReact
              configuration={{
                content: openApiSpec, // Direct calls
                proxyUrl: "",
                authentication: {
                  preferredSecurityScheme: "bearerAuth",
                  securitySchemes: {
                    bearerAuth: {
                      token: apiKey,
                    },
                  },
                },
                theme: "none", // We use custom CSS variables
                hideDownloadButton: true,
                hideTestRequestButton: false,
                isEditable: false,
                showSidebar: true,
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
