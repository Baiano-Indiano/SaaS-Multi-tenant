"use client";

import * as React from "react";
import { 
  Trash2, 
  Play, 
  AlertCircle,
  Loader2,
  Settings2,
  Globe
} from "lucide-react";
import { SlackIcon, DiscordIcon, TeamsIcon } from "@/components/icons";
import { EventMappingDialog } from "./event-mapping-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  deleteConnectorAction, 
  testConnectorAction 
} from "@/app/actions/connectors";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface Connector {
  id: string;
  name: string;
  type: string;
  config: string;
  isActive: boolean;
  createdAt: Date;
}

interface ConnectorListProps {
  connectors: Connector[];
  orgId: string;
  orgSlug: string;
}

export function ConnectorList({ connectors, orgId, orgSlug }: ConnectorListProps) {
  const t = useTranslations("Settings.integrations");
  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [mappingConnector, setMappingConnector] = React.useState<{ id: string, name: string } | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  React.useEffect(() => {
    const success = searchParams.get("success");
    if (success === "slack" || success === "teams") {
      const toastMessage = success === "slack" ? t("slackConnectedToast") : t("teamsConnectedToast");
      toast.success(toastMessage);
      // Clean up query param from URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete("success");
      const cleanPath = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      router.replace(cleanPath);
    }
  }, [searchParams, router, t]);

  const handleDelete = async (connectorId: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    
    setDeletingId(connectorId);
    try {
      const result = await deleteConnectorAction({ connectorId, orgId, orgSlug });
      if (result.error) toast.error(result.error);
      else toast.success(t("integrationRemovedToast"));
    } catch {
      toast.error(t("deleteFailedToast"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleTest = async (connectorId: string) => {
    setTestingId(connectorId);
    try {
      const result = await testConnectorAction({ connectorId, orgId });
      if (result.error) toast.error(result.error);
      else toast.success(t("testSuccessToast"));
    } catch {
      toast.error(t("testFailedToast"));
    } finally {
      setTestingId(null);
    }
  };

  if (connectors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
        <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4 ring-1 ring-zinc-800">
          <AlertCircle className="h-6 w-6 text-zinc-500" />
        </div>
        <h3 className="text-zinc-200 font-medium">{t("noIntegrations")}</h3>
        <p className="text-zinc-500 text-sm mt-1 text-center max-w-xs">
          {t("noIntegrationsDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {connectors.map((connector) => (
        <Card key={connector.id} className="bg-zinc-950 border-zinc-800/60 hover:border-zinc-700/60 transition-all duration-300 group overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center ring-1 ring-inset",
              connector.type === 'slack' ? "bg-[#4A154B]/10 ring-[#4A154B]/30" : 
              connector.type === 'teams' ? "bg-[#4B53BC]/10 ring-[#4B53BC]/30" : 
              connector.type === 'webhook' ? "bg-zinc-800/10 ring-zinc-700/30" : 
              "bg-[#5865F2]/10 ring-[#5865F2]/30"
            )}>
              {connector.type === 'slack' && (
                <SlackIcon className="h-5 w-5 text-[#4A154B]" />
              )}
              {connector.type === 'teams' && (
                <TeamsIcon className="h-5 w-5 text-[#7B83EB]" />
              )}
              {connector.type === 'webhook' && (
                <Globe className="h-5 w-5 text-zinc-400" />
              )}
              {connector.type === 'discord' && (
                <DiscordIcon className="h-5 w-5 text-[#5865F2]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-bold text-zinc-100 truncate">
                {connector.name}
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 flex items-center gap-1.5">
                {connector.type === 'slack' ? 'Slack' : 
                 connector.type === 'teams' ? 'Microsoft Teams' : 
                 connector.type === 'webhook' ? 'Webhook' : 
                 connector.type.charAt(0).toUpperCase() + connector.type.slice(1)} {(() => {
                  try {
                    const config = JSON.parse(connector.config);
                    return (config.accessToken || config.flow === 'oauth') ? "OAuth" : "Webhook";
                  } catch {
                    return "Webhook";
                  }
                })()}
                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span className="truncate max-w-[180px]">
                  {(() => {
                    try {
                      const config = JSON.parse(connector.config);
                      if (connector.type === "slack" && config.teamName && config.channel) {
                        return `${config.teamName} (${config.channel})`;
                      }
                      if (connector.type === "teams" && config.flow === "oauth") {
                        return "Graph API Connection";
                      }
                      return config.url || "";
                    } catch {
                      return "";
                    }
                  })()}
                </span>
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] h-5">
              {t("activeBadge")}
            </Badge>
          </CardHeader>
          <CardContent className="pt-4 flex items-center justify-between gap-2 border-t border-zinc-900/50 mt-2 bg-zinc-900/10">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTest(connector.id)}
                disabled={testingId === connector.id}
                className="h-8 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                {testingId === connector.id ? (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : (
                  <Play className="h-3 w-3 mr-2" />
                )}
                {t("testButton")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMappingConnector({ id: connector.id, name: connector.name })}
                className="h-8 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                <Settings2 className="h-3 w-3 mr-2" />
                {t("eventsButton")}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={deletingId === connector.id}
                onClick={() => handleDelete(connector.id)}
                className="h-8 text-xs text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
              >
                {deletingId === connector.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </CardContent>
          
          {/* Subtle bottom accent line */}
          <div className={cn(
            "h-[2px] w-full mt-auto opacity-30",
            connector.type === 'slack' ? "bg-[#4A154B]" : 
            connector.type === 'teams' ? "bg-[#4B53BC]" : 
            connector.type === 'webhook' ? "bg-zinc-700" :
            "bg-[#5865F2]"
          )} />
        </Card>
      ))}

      {mappingConnector && (
        <EventMappingDialog
          connectorId={mappingConnector.id}
          connectorName={mappingConnector.name}
          orgId={orgId}
          orgSlug={orgSlug}
          open={!!mappingConnector}
          onOpenChange={(open) => !open && setMappingConnector(null)}
        />
      )}
    </div>
  );
}
