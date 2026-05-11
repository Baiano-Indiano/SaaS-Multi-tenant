"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { createWebhookAction } from "@/app/actions/webhooks";
import { Plus, Globe } from "lucide-react";
import { useTranslations } from "next-intl";

const SUPPORTED_EVENTS = [
  "project.created",
  "project.deleted",
  "member.invited",
  "member.removed",
  "billing.plan_updated",
] as const;

interface CreateWebhookDialogProps {
  orgId: string;
  orgSlug: string;
}

export function CreateWebhookDialog({ orgId, orgSlug }: CreateWebhookDialogProps) {
  const t = useTranslations("Settings.connectivity.webhooks.dialog");
  const te = useTranslations("Settings.connectivity.webhooks.events");
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleCreate = async () => {
    if (!url) {
      toast.error(t("toast.urlRequired"));
      return;
    }

    if (selectedEvents.length === 0) {
      toast.error(t("toast.eventRequired"));
      return;
    }

    setLoading(true);
    try {
      const result = await createWebhookAction({
        url,
        events: selectedEvents,
        orgId,
        orgSlug,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("toast.success"));
        setOpen(false);
        setUrl("");
        setSelectedEvents([]);
      }
    } catch {
      toast.error(t("toast.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="w-4 h-4" />
          {useTranslations("Settings.connectivity.webhooks")("add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">{t("urlLabel")}</Label>
            <Input
              id="url"
              placeholder={t("placeholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-secondary/30 border-primary/10 focus-visible:ring-primary/20"
            />
          </div>

          <div className="grid gap-3">
            <Label>{t("eventsLabel")}</Label>
            <div className="grid grid-cols-1 gap-2 border rounded-lg p-3 bg-secondary/10 border-primary/5">
              {SUPPORTED_EVENTS.map((eventId) => (
                <div key={eventId} className="flex items-center space-x-2">
                  <Checkbox
                    id={eventId}
                    checked={selectedEvents.includes(eventId)}
                    onCheckedChange={() => toggleEvent(eventId)}
                  />
                  <label
                    htmlFor={eventId}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {te(eventId.replace(".", "_") as Parameters<typeof te>[0])}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleCreate} isLoading={loading} className="min-w-[100px]">
            {t("register")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
