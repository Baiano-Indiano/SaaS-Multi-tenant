"use client";

import * as React from "react";
import { 
  Trash2, 
  Play, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { SlackIcon, DiscordIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  deleteConnectorAction, 
  testConnectorAction 
} from "@/app/actions/connectors";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (connectorId: string) => {
    if (!confirm("Are you sure you want to delete this integration?")) return;
    
    setDeletingId(connectorId);
    try {
      const result = await deleteConnectorAction({ connectorId, orgId, orgSlug });
      if (result.error) toast.error(result.error);
      else toast.success("Integration removed");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTest = async (connectorId: string) => {
    setTestingId(connectorId);
    try {
      const result = await testConnectorAction({ connectorId, orgId });
      if (result.error) toast.error(result.error);
      else toast.success("Test message sent! Check your channel.");
    } catch {
      toast.error("Test failed to send");
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
        <h3 className="text-zinc-200 font-medium">No integrations yet</h3>
        <p className="text-zinc-500 text-sm mt-1 text-center max-w-xs">
          Connect Slack or Discord to start receiving rich notifications about your organization&apos;s activity.
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
              connector.type === 'slack' ? "bg-[#4A154B]/10 ring-[#4A154B]/30" : "bg-[#5865F2]/10 ring-[#5865F2]/30"
            )}>
              {connector.type === 'slack' ? (
                <SlackIcon className="h-5 w-5 text-[#4A154B]" />
              ) : (
                <DiscordIcon className="h-5 w-5 text-[#5865F2]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-bold text-zinc-100 truncate">
                {connector.name}
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 flex items-center gap-1.5">
                {connector.type.charAt(0).toUpperCase() + connector.type.slice(1)} Webhook
                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span className="truncate max-w-[120px]">
                  {JSON.parse(connector.config).url}
                </span>
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] h-5">
              Active
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
                Test
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
            connector.type === 'slack' ? "bg-[#4A154B]" : "bg-[#5865F2]"
          )} />
        </Card>
      ))}
    </div>
  );
}
