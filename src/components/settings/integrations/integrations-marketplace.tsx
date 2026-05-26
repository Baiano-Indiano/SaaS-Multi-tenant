"use client";

import * as React from "react";
import { Puzzle, Globe, Plus } from "lucide-react";
import { SlackIcon, TeamsIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { TeamsSetupDialog } from "./teams-setup-dialog";
import { WebhookSetupDialog } from "./webhook-setup-dialog";

interface IntegrationsMarketplaceProps {
  orgId: string;
  orgSlug: string;
}

export function IntegrationsMarketplace({ orgId, orgSlug }: IntegrationsMarketplaceProps) {
  const t = useTranslations("Settings.integrations");
  const [teamsOpen, setTeamsOpen] = React.useState(false);
  const [webhookOpen, setWebhookOpen] = React.useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Slack Card */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col justify-between gap-4 transition-all hover:border-zinc-700 hover:bg-zinc-900/40 group">
          <div className="flex flex-col gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#4A154B]/10 flex items-center justify-center ring-1 ring-[#4A154B]/30">
              <SlackIcon className="h-5 w-5 text-[#4A154B]" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">{t("slack.title")}</p>
              <p className="text-xs text-zinc-550 leading-relaxed mt-0.5">{t("slack.desc")}</p>
            </div>
          </div>
          <a
            href={`/api/connectors/slack/authorize?orgSlug=${orgSlug}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100 bg-transparent text-zinc-300 font-bold text-xs"
            )}
          >
            {t("connectSlack")}
          </a>
        </div>

        {/* MS Teams Card */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col justify-between gap-4 transition-all hover:border-zinc-700 hover:bg-zinc-900/40 group">
          <div className="flex flex-col gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#4B53BC]/10 flex items-center justify-center ring-1 ring-[#4B53BC]/30">
              <TeamsIcon className="h-5 w-5 text-[#7B83EB]" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">{t("teams.title")}</p>
              <p className="text-xs text-zinc-555 leading-relaxed mt-0.5">{t("teams.desc")}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTeamsOpen(true)}
            className="w-full border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100 bg-transparent text-zinc-300 font-bold text-xs"
          >
            {t("connectTeams")}
          </Button>
        </div>

        {/* Custom Webhook Card */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col justify-between gap-4 transition-all hover:border-zinc-700 hover:bg-zinc-900/40 group">
          <div className="flex flex-col gap-3">
            <div className="h-10 w-10 rounded-lg bg-zinc-800/20 flex items-center justify-center ring-1 ring-zinc-800">
              <Globe className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">{t("customWebhook.title")}</p>
              <p className="text-xs text-zinc-556 leading-relaxed mt-0.5">{t("customWebhook.desc")}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWebhookOpen(true)}
            className="w-full border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100 bg-transparent text-zinc-300 font-bold text-xs"
          >
            {t("connectWebhook")}
          </Button>
        </div>
      </div>

      {/* Setup Dialogs */}
      <TeamsSetupDialog
        orgId={orgId}
        orgSlug={orgSlug}
        open={teamsOpen}
        onOpenChange={setTeamsOpen}
      />

      <WebhookSetupDialog
        orgId={orgId}
        orgSlug={orgSlug}
        open={webhookOpen}
        onOpenChange={setWebhookOpen}
      />
    </>
  );
}
