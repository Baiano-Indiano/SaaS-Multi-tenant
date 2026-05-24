"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  getConnectorEventsAction, 
  toggleConnectorEventAction 
} from "@/app/actions/connectors";
import { toast } from "sonner";
import { 
  Loader2, 
  Settings2,
  Rocket, 
  UserPlus, 
  UserMinus, 
  Settings, 
  ShieldCheck, 
  Trash2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

interface EventType {
  id: string;
  name: string;
  label: string;
  description: string;
  iconName: string;
  isActive: boolean;
}

interface EventMappingDialogProps {
  connectorId: string;
  connectorName: string;
  orgId: string;
  orgSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  "rocket": Rocket,
  "trash": Trash2,
  "user-plus": UserPlus,
  "shield-check": ShieldCheck,
  "user-minus": UserMinus,
  "settings": Settings,
};

export function EventMappingDialog({
  connectorId,
  connectorName,
  orgId,
  orgSlug,
  open,
  onOpenChange,
}: EventMappingDialogProps) {
  const t = useTranslations("Settings.integrations");
  const [events, setEvents] = React.useState<EventType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [toggling, setToggling] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;

    const loadEvents = async () => {
      setLoading(true);
      try {
        const result = await getConnectorEventsAction({ connectorId, orgId });
        if (result.success && result.events) {
          setEvents(result.events as EventType[]);
        }
      } catch {
        toast.error(t("toastUnexpectedError"));
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [open, connectorId, orgId, t]);

  const handleToggle = async (eventId: string, currentStatus: boolean) => {
    setToggling(eventId);
    try {
      const result = await toggleConnectorEventAction({
        connectorId,
        orgId,
        orgSlug,
        event: eventId,
        isActive: !currentStatus,
      });

      if (result.success) {
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, isActive: !currentStatus } : e))
        );
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t("toastUnexpectedError"));
    } finally {
      setToggling(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-100 overflow-hidden p-0">
        <div className="p-6 pb-4 border-b border-zinc-900/50">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-9 w-9 rounded-xl bg-zinc-900 flex items-center justify-center ring-1 ring-zinc-800">
                <Settings2 className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {t("notificationSettings")}
                </DialogTitle>
                <DialogDescription className="text-zinc-500 text-xs">
                  {t.rich("notificationSettingsDesc", {
                    name: connectorName,
                    highlight: (chunks: any) => <span className="text-zinc-300 font-medium">{chunks}</span>
                  })}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[60vh] px-2 py-4">
          <div className="space-y-2 px-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 text-zinc-700 animate-spin" />
                <p className="text-zinc-600 text-sm animate-pulse">{t("loadingEvents")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {events.map((event, index) => {
                    const Icon = Reflect.get(ICON_MAP, event.iconName) || Settings2;
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all duration-300 group",
                          event.isActive 
                            ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30" 
                            : "bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700/60"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300",
                            event.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500 group-hover:text-zinc-400"
                          )}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="space-y-1">
                            <Label
                              htmlFor={event.id}
                              className="text-sm font-semibold text-zinc-200 cursor-pointer block"
                            >
                              {event.label}
                            </Label>
                            <p className="text-xs text-zinc-500 leading-relaxed max-w-[280px]">
                              {event.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {toggling === event.id && (
                            <Loader2 className="h-3 w-3 text-zinc-500 animate-spin" />
                          )}
                          <Switch
                            id={event.id}
                            checked={event.isActive}
                            onCheckedChange={() => handleToggle(event.id, event.isActive)}
                            disabled={toggling === event.id}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-zinc-900/30 border-t border-zinc-900/50 flex justify-end">
          <button
            onClick={() => onOpenChange(false)}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors px-4 py-2"
          >
            {t("doneButton")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
