"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Zap, 
  Activity, 
  MoreHorizontal, 
  Link as LinkIcon,
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { deleteWorkflowAction } from "@/app/actions/workflows";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { WorkflowLogsModal } from "./workflow-logs";
import { useTranslations } from "next-intl";
import { useConfirm } from "@/components/ui/confirm-dialog";

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  actionType: string;
  actionConfig: string; // JSON string
  isActive: boolean;
  createdAt: Date;
}

interface WorkflowListProps {
  workflows: Workflow[];
  orgId: string;
  orgSlug: string;
}

export function WorkflowList({ workflows, orgId, orgSlug }: WorkflowListProps) {
  const t = useTranslations("Settings.connectivity.automations");
  const { confirm } = useConfirm();
  const [logWorkflow, setLogWorkflow] = useState<Workflow | null>(null);

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: t("actions.delete.confirmTitle"),
      description: t("actions.delete.confirmDescription"),
      confirmText: t("actions.delete.confirmButton"),
      cancelText: t("actions.delete.cancelButton"),
      variant: "destructive",
    });

    if (!isConfirmed) return;

    toast.promise(
      deleteWorkflowAction({
        workflowId: id,
        orgId,
        orgSlug,
      }),
      {
        loading: t("toast.deleting"),
        success: (result: { error?: string }) => {
          if (result.error) throw new Error(result.error);
          return t("toast.success");
        },
        error: (err: { message?: string }) => err.message || t("toast.error"),
      }
    );
  };

  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-xl bg-secondary/10 border-primary/10">
        <Zap className="w-12 h-12 text-primary/20 mb-4" />
        <h3 className="text-lg font-semibold text-foreground/80">{t("empty.title")}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-[400px] mt-1">
          {t("empty.description")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/5 bg-secondary/5 overflow-hidden">
      <Table>
        <TableHeader className="bg-secondary/20">
          <TableRow className="hover:bg-transparent border-primary/10">
            <TableHead className="w-[30%]">{t("table.name")}</TableHead>
            <TableHead>{t("table.trigger")}</TableHead>
            <TableHead>{t("table.action")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead className="text-right">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {workflows.map((workflow, index) => {
              let config = { url: "" };
              try {
                config = JSON.parse(workflow.actionConfig);
              } catch (e) {
                console.error("Failed to parse workflow config", e);
              }
              
              return (
                <motion.tr
                  key={workflow.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group hover:bg-secondary/10 border-primary/5 transition-colors"
                >
                  <TableCell className="font-medium py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-orange-500" />
                      </div>
                      <span className="truncate max-w-[200px]">{workflow.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10">
                      {workflow.trigger}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LinkIcon className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{config.url}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={workflow.isActive ? "default" : "secondary"}>
                      {workflow.isActive ? t("status.active") : t("status.paused")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => setLogWorkflow(workflow)}>
                          <Activity className="mr-2 h-4 w-4" />
                          <span>{t("menu.viewLogs")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(workflow.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>{t("menu.delete")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </TableBody>
      </Table>

      <WorkflowLogsModal 
        isOpen={!!logWorkflow}
        onClose={() => setLogWorkflow(null)}
        workflowId={logWorkflow?.id || ""}
        workflowName={logWorkflow?.name || ""}
        orgId={orgId}
        orgSlug={orgSlug}
      />
    </div>
  );
}
