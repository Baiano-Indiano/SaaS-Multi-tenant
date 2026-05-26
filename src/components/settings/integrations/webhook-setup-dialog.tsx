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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Loader2 } from "lucide-react";
import { createConnectorAction } from "@/app/actions/connectors";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP);

interface WebhookSetupDialogProps {
  orgId: string;
  orgSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookSetupDialog({ orgId, orgSlug, open, onOpenChange }: WebhookSetupDialogProps) {
  const t = useTranslations("Settings.integrations");
  const [isPending, setIsPending] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const webhookUrl = formData.get("webhookUrl") as string;

    try {
      const result = await createConnectorAction({
        name,
        type: "webhook",
        webhookUrl,
        orgId,
        orgSlug,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("toastSuccess"));
        onOpenChange(false);
      }
    } catch {
      toast.error(t("toastUnexpectedError"));
    } finally {
      setIsPending(false);
    }
  };

  useGSAP(() => {
    if (open) {
      gsap.from(".webhook-field", {
        y: 15,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 0.35,
        ease: "power2.out",
      });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={dialogRef} className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center ring-1 ring-zinc-800">
              <Globe className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold bg-gradient-to-br from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                {t("customWebhook.title")}
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs">
                {t("dialogWebhookDesc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-4">
            <div className="space-y-2 webhook-field">
              <Label htmlFor="name" className="text-zinc-300 text-xs">{t("nameLabel")}</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. My Custom API Webhook"
                required
                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-650 focus:ring-zinc-700 h-9"
              />
            </div>

            <div className="space-y-2 webhook-field">
              <Label htmlFor="webhookUrl" className="text-zinc-300 text-xs">{t("webhookUrlLabel")}</Label>
              <Input
                id="webhookUrl"
                name="webhookUrl"
                placeholder="https://your-api.com/webhook"
                type="url"
                required
                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-650 focus:ring-zinc-700 h-9"
              />
              <p className="text-[10px] text-zinc-500 italic">
                {t("securityNotice")}
              </p>
            </div>
          </div>

          <DialogFooter className="webhook-field pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 transition-all active:scale-95 text-xs font-bold"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  {t("creating")}
                </>
              ) : (
                t("createConnector")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
