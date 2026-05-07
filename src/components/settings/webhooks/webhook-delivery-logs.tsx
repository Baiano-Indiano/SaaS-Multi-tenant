"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { getWebhookDeliveriesAction } from "@/app/actions/webhooks";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DeliveryLog {
  id: string;
  eventType: string;
  payload: string;
  responseStatus: string | null;
  responseBody: string | null;
  duration: string | null;
  createdAt: Date;
}

interface WebhookDeliveryLogsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  webhookId: string;
  webhookUrl: string;
  orgId: string;
}

export function WebhookDeliveryLogsSheet({
  isOpen,
  onOpenChange,
  webhookId,
  webhookUrl,
  orgId,
}: WebhookDeliveryLogsSheetProps) {
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchLogs = async () => {
        setIsLoading(true);
        try {
          const data = await getWebhookDeliveriesAction(orgId, webhookId);
          setLogs(data as DeliveryLog[]);
        } catch (error) {
          console.error("Failed to fetch logs:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchLogs();
    }
  }, [isOpen, webhookId, orgId]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Delivery Logs
          </SheetTitle>
          <SheetDescription className="truncate">
            Recent activity for {webhookUrl}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading delivery history...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-secondary/5">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <p className="text-sm text-muted-foreground">No deliveries recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <DeliveryLogItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DeliveryLogItem({ log }: { log: DeliveryLog }) {
  const [isOpen, setIsOpen] = useState(false);
  const isSuccess = log.responseStatus?.startsWith("2");

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border border-primary/5 bg-secondary/5 rounded-lg overflow-hidden transition-all hover:bg-secondary/10"
    >
      <CollapsibleTrigger className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center gap-3">
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <XCircle className="w-5 h-5 text-destructive" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-tight">
                {log.eventType}
              </span>
              <Badge variant={isSuccess ? "outline" : "destructive"} className="text-[10px] h-5">
                {log.responseStatus || "FAILED"}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {format(new Date(log.createdAt), "MMM d, HH:mm:ss.SSS")} • {log.duration}ms
            </p>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent className="p-4 pt-0 border-t border-primary/5 bg-black/20">
        <div className="mt-4 space-y-4">
          <div>
            <h5 className="text-[10px] font-bold uppercase text-primary/60 mb-2">Payload</h5>
            <pre className="p-3 bg-zinc-950 rounded border border-white/5 text-[10px] font-mono overflow-x-auto text-zinc-300">
              {JSON.stringify(JSON.parse(log.payload), null, 2)}
            </pre>
          </div>
          
          {log.responseBody && (
            <div>
              <h5 className="text-[10px] font-bold uppercase text-primary/60 mb-2">Response Body</h5>
              <pre className="p-3 bg-zinc-950 rounded border border-white/5 text-[10px] font-mono overflow-x-auto text-zinc-300">
                {log.responseBody}
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
