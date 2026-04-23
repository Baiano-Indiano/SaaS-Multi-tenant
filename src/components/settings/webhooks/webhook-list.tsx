"use client";


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
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { deleteWebhookAction } from "@/app/actions/webhooks";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

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
}

export function WebhookList({ webhooks, orgId, orgSlug }: WebhookListProps) {
  const handleDelete = async (id: string) => {
    toast.promise(
      deleteWebhookAction({
        webhookId: id,
        orgId,
        orgSlug,
      }),
      {
        loading: "Deleting webhook...",
        success: (result) => {
          if (result.error) throw new Error(result.error);
          return "Webhook deleted successfully";
        },
        error: (err) => err.message || "Failed to delete webhook",
      }
    );
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success("Signing secret copied to clipboard");
  };

  if (webhooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-xl bg-secondary/10 border-primary/10">
        <Globe className="w-12 h-12 text-primary/20 mb-4" />
        <h3 className="text-lg font-semibold text-foreground/80">No webhooks registered</h3>
        <p className="text-sm text-muted-foreground text-center max-w-[400px] mt-1">
          Register a webhook to receive real-time notifications about events in your organization.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/5 bg-secondary/5 overflow-hidden">
      <Table>
        <TableHeader className="bg-secondary/20">
          <TableRow className="hover:bg-transparent border-primary/10">
            <TableHead className="w-[40%]">Endpoint URL</TableHead>
            <TableHead>Events</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={webhook.isActive ? "default" : "secondary"} className="gap-1">
                      {webhook.isActive ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </>
                      ) : (
                        "Inactive"
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(webhook.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Webhook Settings</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => copySecret(webhook.secret)}>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            <span>Copy Signing Secret</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-muted-foreground opacity-50 cursor-not-allowed">
                            <Activity className="mr-2 h-4 w-4" />
                            <span>View Delivery Logs (v16)</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(webhook.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Webhook</span>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
