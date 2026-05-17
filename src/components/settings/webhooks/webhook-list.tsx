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
  Globe, 
  Activity, 
  MoreHorizontal, 
  ShieldCheck
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { WebhookDeliveryLogsSheet } from "./webhook-delivery-logs";
import { deleteWebhookAction } from "@/app/actions/webhooks";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useConfirm } from "../../ui/confirm-dialog";

export interface Webhook {
  id: string;
  url: string;
  secret: string;
  events: string; // JSON string
  isActive: boolean;
  createdAt: Date;
}

interface WebhookListProps {
  webhooks: Webhook[];
  orgId: string;
  orgSlug: string;
  hasUpdatePermission?: boolean;
}

export function WebhookList({ webhooks, orgId, orgSlug, hasUpdatePermission = false }: WebhookListProps) {
  const t = useTranslations("Settings.connectivity.webhooks");
  const [selectedWebhook, setSelectedWebhook] = useState<{ id: string, url: string } | null>(null);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  const { confirm } = useConfirm();

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
      deleteWebhookAction({
        webhookId: id,
        orgId,
        orgSlug,
      }),
      {
        loading: t("toast.deleting"),
        success: (result: { error?: string }) => {
          if (result.error) throw new Error(result.error);
          return t("toast.success");
        },
        error: (err: Error) => err.message || t("toast.error"),
      }
    );
  };

  if (webhooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-xl bg-secondary/10 border-primary/10">
        <Globe className="w-12 h-12 text-primary/20 mb-4" />
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
            <TableHead className="w-[40%]">{t("table.url")}</TableHead>
            <TableHead>{t("table.events")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead>{t("table.createdAt")}</TableHead>
            <TableHead className="text-right">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {webhooks.map((webhook, index) => {
              const events = JSON.parse(webhook.events) as string[];
              
              return (
                <motion.tr
                  key={webhook.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group hover:bg-secondary/10 border-primary/5 transition-colors"
                >
                  <TableCell className="font-medium py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-primary" />
                      </div>
                      <span className="truncate max-w-[300px]">{webhook.url}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {events.map((event) => (
                        <Badge 
                          key={event} 
                          variant="secondary" 
                          className="text-[10px] uppercase tracking-wider bg-primary/5 border-primary/10"
                        >
                          {t(`events.${event.replace(".", "_")}` as Parameters<typeof t>[0])}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={webhook.isActive ? "default" : "secondary"} className="gap-1">
                      {webhook.isActive ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {t("status.active")}
                        </>
                      ) : (
                        t("status.inactive")
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(webhook.createdAt), "MMM d, yyyy")}
                  </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary/20">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                          {hasUpdatePermission && (
                            <DropdownMenuItem 
                              className="hover:bg-secondary/20 focus:bg-secondary/20 cursor-pointer"
                              onSelect={() => {
                                navigator.clipboard.writeText(webhook.secret);
                                toast.success(t("toast.copySuccess"));
                              }}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              {t("menu.copySecret")}
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem 
                            className="hover:bg-secondary/20 focus:bg-secondary/20 cursor-pointer"
                            onSelect={() => {
                              setSelectedWebhook(webhook);
                              setIsLogsOpen(true);
                            }}
                          >
                            <Activity className="mr-2 h-4 w-4" />
                            {t("menu.viewLogs")}
                          </DropdownMenuItem>

                          {hasUpdatePermission && (
                            <>
                              <DropdownMenuSeparator className="bg-border" />
                              
                              <DropdownMenuItem 
                                className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer"
                                onSelect={() => handleDelete(webhook.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>{t("menu.delete")}</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </TableBody>
      </Table>

      {selectedWebhook && (
        <WebhookDeliveryLogsSheet 
          isOpen={isLogsOpen}
          onOpenChange={setIsLogsOpen}
          webhookId={selectedWebhook.id}
          webhookUrl={selectedWebhook.url}
          orgId={orgId}
        />
      )}
    </div>
  );
}

