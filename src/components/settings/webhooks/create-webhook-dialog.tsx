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

const SUPPORTED_EVENTS = [
  { id: "project.created", label: "Project Created" },
  { id: "project.deleted", label: "Project Deleted" },
  { id: "member.invited", label: "Member Invited" },
  { id: "member.removed", label: "Member Removed" },
  { id: "billing.plan_updated", label: "Subscription Updated" },
];

interface CreateWebhookDialogProps {
  orgId: string;
  orgSlug: string;
}

export function CreateWebhookDialog({ orgId, orgSlug }: CreateWebhookDialogProps) {
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
      toast.error("Please enter a destination URL");
      return;
    }

    if (selectedEvents.length === 0) {
      toast.error("Please select at least one event");
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
        toast.success("Webhook registered successfully!");
        setOpen(false);
        setUrl("");
        setSelectedEvents([]);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Plus className="w-4 h-4" />
            Add Webhook
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Register New Webhook
          </DialogTitle>
          <DialogDescription>
            We&apos;ll send POST requests to this URL when the selected events occur.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">Payload URL</Label>
            <Input
              id="url"
              placeholder="https://your-api.com/webhooks"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-secondary/30 border-primary/10 focus-visible:ring-primary/20"
            />
          </div>

          <div className="grid gap-3">
            <Label>Events to send</Label>
            <div className="grid grid-cols-1 gap-2 border rounded-lg p-3 bg-secondary/10 border-primary/5">
              {SUPPORTED_EVENTS.map((event) => (
                <div key={event.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={event.id}
                    checked={selectedEvents.includes(event.id)}
                    onCheckedChange={() => toggleEvent(event.id)}
                  />
                  <label
                    htmlFor={event.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {event.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} isLoading={loading} className="min-w-[100px]">
            Register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
