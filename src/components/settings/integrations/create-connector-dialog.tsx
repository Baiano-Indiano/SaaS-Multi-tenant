"use client";

import * as React from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { SlackIcon, DiscordIcon } from "@/components/icons";
import { createConnectorAction } from "@/app/actions/connectors";
import { toast } from "sonner";

gsap.registerPlugin(useGSAP);

interface CreateConnectorDialogProps {
  orgId: string;
  orgSlug: string;
}

export function CreateConnectorDialog({ orgId, orgSlug }: CreateConnectorDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const webhookUrl = formData.get("webhookUrl") as string;

    try {
      const result = await createConnectorAction({
        name,
        type,
        webhookUrl,
        orgId,
        orgSlug,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Connector created successfully!");
        setIsOpen(false);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  useGSAP(() => {
    if (isOpen) {
      gsap.from(".connector-field", {
        y: 20,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 0.4,
        ease: "back.out(1.7)",
      });
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200">
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        }
      />
      <DialogContent ref={dialogRef} className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-br from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            New Integration
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Connect a new external service to receive rich notifications.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2 connector-field">
              <Label htmlFor="name" className="text-zinc-300">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Engineering Slack"
                required
                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:ring-zinc-700"
              />
            </div>
            <div className="space-y-2 connector-field">
              <Label htmlFor="type" className="text-zinc-300">Service Type</Label>
              <Select name="type" defaultValue="slack" required>
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-zinc-100 focus:ring-zinc-700">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                  <SelectItem value="slack">
                    <div className="flex items-center gap-2">
                      <SlackIcon className="h-4 w-4 text-[#4A154B]" />
                      <span>Slack</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="discord">
                    <div className="flex items-center gap-2">
                      <DiscordIcon className="h-4 w-4 text-[#5865F2]" />
                      <span>Discord</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 connector-field">
              <Label htmlFor="webhookUrl" className="text-zinc-300">Webhook URL</Label>
              <Input
                id="webhookUrl"
                name="webhookUrl"
                placeholder="https://hooks.slack.com/services/..."
                type="url"
                required
                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:ring-zinc-700"
              />
              <p className="text-[10px] text-zinc-500 italic">
                Your credentials are encrypted and stored securely within your tenant schema.
              </p>
            </div>
          </div>
          <DialogFooter className="connector-field">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 transition-all active:scale-95"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Connector"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
