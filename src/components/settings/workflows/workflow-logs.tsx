"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getWorkflowLogsAction, retryWorkflowDeliveryAction } from "@/app/actions/workflows";
import { format } from "date-fns";
import { Loader2, CheckCircle2, XCircle, Clock, RefreshCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Log {
  id: string;
  eventType: string;
  responseStatus: string | null;
  duration: string | null;
  createdAt: Date;
  payload: string;
  responseBody: string | null;
}

interface WorkflowLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  workflowName: string;
  orgId: string;
  orgSlug: string;
}

export function WorkflowLogsModal({ 
  isOpen, 
  onClose, 
  workflowId, 
  workflowName,
  orgId,
  orgSlug
}: WorkflowLogsModalProps) {
  const t = useTranslations("WorkflowLogs");
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getWorkflowLogsAction(orgId, workflowId);
      setLogs(data as Log[]);
    } catch (err) {
      console.error("Error loading logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, workflowId]);

  useEffect(() => {
    if (isOpen && workflowId) {
      loadLogs();
    }
  }, [isOpen, workflowId, loadLogs]);

  const handleRetry = async (deliveryId: string) => {
    setRetryingId(deliveryId);
    try {
      const result = await retryWorkflowDeliveryAction({
        deliveryId,
        orgId,
        orgSlug
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("retrySuccess"));
      }
    } catch {
      toast.error(t("retryFailed"));
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t.rich("title", {
              name: workflowName,
              highlight: (chunks) => <span className="text-primary">{chunks}</span>
            })}
          </DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-[400px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
            </div>
          ) : logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-secondary/5 border-primary/5">
              <Clock className="w-12 h-12 mb-4 opacity-20" />
              <p>{t("noLogs")}</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("event")}</TableHead>
                    <TableHead>{t("duration")}</TableHead>
                    <TableHead>{t("executedAt")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const isSuccess = log.responseStatus && parseInt(log.responseStatus) < 300;
                    
                    return (
                      <Fragment key={log.id}>
                        <TableRow 
                          className="group hover:bg-secondary/10 cursor-pointer"
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isSuccess ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-destructive" />
                              )}
                              <Badge variant={isSuccess ? "outline" : "destructive"} className={isSuccess ? "border-emerald-500/20 text-emerald-500" : ""}>
                                {log.responseStatus || "ERR"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.eventType}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {log.duration}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                          </TableCell>
                        </TableRow>
                        {expandedId === log.id && (
                          <TableRow className="bg-secondary/5 border-primary/5 hover:bg-secondary/5">
                            <TableCell colSpan={4} className="p-4">
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">{t("payload")}</div>
                                    <pre className="p-3 rounded-lg bg-black/20 text-[10px] overflow-auto max-h-[200px] border border-white/5">
                                      {JSON.stringify(JSON.parse(log.payload), null, 2)}
                                    </pre>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">{t("response")}</div>
                                    <pre className="p-3 rounded-lg bg-black/20 text-[10px] overflow-auto max-h-[200px] border border-white/5">
                                      {log.responseBody || t("noResponseBody")}
                                    </pre>
                                  </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 gap-2 border-primary/20 hover:bg-primary/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRetry(log.id);
                                    }}
                                    disabled={retryingId === log.id}
                                  >
                                    {retryingId === log.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <RefreshCcw className="w-3 h-3" />
                                    )}
                                    {retryingId === log.id ? t("retrying") : t("retryDelivery")}
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
