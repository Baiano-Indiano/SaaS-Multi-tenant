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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamsIcon } from "@/components/icons";
import { Link2, ShieldAlert, Loader2 } from "lucide-react";
import { createConnectorAction } from "@/app/actions/connectors";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP);

interface TeamsSetupDialogProps {
  orgId: string;
  orgSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamsSetupDialog({ orgId, orgSlug, open, onOpenChange }: TeamsSetupDialogProps) {
  const t = useTranslations("Settings.integrations");
  const [isPending, setIsPending] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  const handleSubmitWebhook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const webhookUrl = formData.get("webhookUrl") as string;

    try {
      const result = await createConnectorAction({
        name,
        type: "teams",
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
      gsap.from(".teams-field", {
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
      <DialogContent ref={dialogRef} className="sm:max-w-[450px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-[#4B53BC]/10 flex items-center justify-center ring-1 ring-[#4B53BC]/30">
              <TeamsIcon className="h-5 w-5 text-[#7B83EB]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold bg-gradient-to-br from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                {t("teams.title")}
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs">
                {t("dialogTeamsDesc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="oauth" className="w-full mt-2">
          <TabsList className="grid grid-cols-2 bg-zinc-900 border border-zinc-800 p-1 h-10 teams-field">
            <TabsTrigger value="oauth" className="text-xs data-[state=active]:bg-zinc-850">
              {t("teamsOidcLabel")}
            </TabsTrigger>
            <TabsTrigger value="webhook" className="text-xs data-[state=active]:bg-zinc-850">
              {t("teamsWebhookLabel")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="oauth" className="space-y-4 pt-4 outline-none teams-field">
            <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800 flex gap-3 text-xs text-zinc-400 leading-relaxed">
              <ShieldAlert className="h-5 w-5 text-[#7B83EB] shrink-0" />
              <div>
                Connect directly using Microsoft Entra ID. This allows secure native communication via MS Graph API.
              </div>
            </div>
            <a
              href={`/api/connectors/teams/authorize?orgSlug=${orgSlug}`}
              className="inline-flex items-center justify-center rounded-md text-sm font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-[#4B53BC] text-zinc-50 hover:bg-[#3b4198] h-10 px-4 py-2 w-full mt-2 shadow-lg shadow-[#4B53BC]/20 hover:scale-[1.01] active:scale-95"
            >
              <TeamsIcon className="h-4 w-4 mr-2" />
              {t("connectTeams")}
            </a>
          </TabsContent>

          <TabsContent value="webhook" className="pt-4 outline-none">
            <form onSubmit={handleSubmitWebhook} className="space-y-4">
              <div className="space-y-2 teams-field">
                <Label htmlFor="name" className="text-zinc-300 text-xs">{t("nameLabel")}</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Engineering Microsoft Teams"
                  required
                  className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-650 focus:ring-zinc-700 h-9"
                />
              </div>

              <div className="space-y-2 teams-field">
                <Label htmlFor="webhookUrl" className="text-zinc-300 text-xs">{t("webhookUrlLabel")}</Label>
                <Input
                  id="webhookUrl"
                  name="webhookUrl"
                  placeholder="https://your-tenant.webhook.office.com/webhookb2/..."
                  type="url"
                  required
                  className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-650 focus:ring-zinc-700 h-9"
                />
                <p className="text-[10px] text-zinc-500 italic">
                  {t("securityNotice")}
                </p>
              </div>

              <DialogFooter className="teams-field pt-2">
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
