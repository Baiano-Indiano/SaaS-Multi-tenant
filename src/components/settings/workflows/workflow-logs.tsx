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
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getWorkflowLogsAction(orgId, workflowId);
      setLogs(data as Log[]);
    } catch (error) {
      console.error("Error loading logs:", error);
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
        toast.success("Retry request sent to QStash");
      }
    } catch (error) {
      toast.error("Failed to re-trigger delivery");
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Execution Logs: <span className="text-primary">{workflowName}</span>
          </DialogTitle>
          <DialogDescription>
            Showing the last 50 execution attempts for this automation.
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
              <p>No execution logs found for this workflow yet.</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Status</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Executed At</TableHead>
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
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Payload</div>
                                    <pre className="p-3 rounded-lg bg-black/20 text-[10px] overflow-auto max-h-[200px] border border-white/5">
                                      {JSON.stringify(JSON.parse(log.payload), null, 2)}
                                    </pre>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Response</div>
                                    <pre className="p-3 rounded-lg bg-black/20 text-[10px] overflow-auto max-h-[200px] border border-white/5">
                                      {log.responseBody || "No response body recorded."}
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
                                    {retryingId === log.id ? "Retrying..." : "Retry Delivery"}
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
