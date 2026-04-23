"use client";

import { useState, useEffect, useCallback } from "react";
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
import { getWorkflowLogsAction } from "@/app/actions/workflows";
import { format } from "date-fns";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
}

export function WorkflowLogsModal({ 
  isOpen, 
  onClose, 
  workflowId, 
  workflowName,
  orgId 
}: WorkflowLogsModalProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
                      <TableRow key={log.id} className="group hover:bg-secondary/10">
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
