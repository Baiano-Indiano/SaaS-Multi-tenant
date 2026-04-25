import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Puzzle, Info, Plus } from "lucide-react";
import { SlackIcon, DiscordIcon } from "@/components/icons";
import { getConnectorsAction } from "@/app/actions/connectors";
import { ConnectorList } from "@/components/settings/integrations/connector-list";
import { CreateConnectorDialog } from "@/components/settings/integrations/create-connector-dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function IntegrationsSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/login");

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) redirect("/selecionar-org");

  const connectorsData = await getConnectorsAction(org.id);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-zinc-400" />
            Integrations
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Connect Gravity to your favorite tools for a seamless enterprise workflow.
          </p>
        </div>
        <CreateConnectorDialog orgId={org.id} orgSlug={org.slug || ""} />
      </div>

      <Alert className="bg-blue-500/5 border-blue-500/20 text-blue-400">
        <Info className="h-4 w-4" />
        <AlertTitle className="text-sm font-semibold">Automatic Formatting</AlertTitle>
        <AlertDescription className="text-xs opacity-80">
          All Slack and Discord notifications are automatically transformed into high-quality rich cards. No manual JSON payload required.
        </AlertDescription>
      </Alert>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-zinc-300">Active Connections</h4>
        </div>
        <ConnectorList 
          connectors={connectorsData} 
          orgId={org.id} 
          orgSlug={org.slug || ""} 
        />
      </section>

      <Separator className="bg-zinc-800/50" />

      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-zinc-300">Available Integrations</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col gap-3 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
            <div className="h-10 w-10 rounded-lg bg-[#4A154B]/10 flex items-center justify-center">
              <SlackIcon className="h-5 w-5 text-[#4A154B]" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">Slack</p>
              <p className="text-xs text-zinc-500">Real-time team notifications via Block Kit.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col gap-3 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
            <div className="h-10 w-10 rounded-lg bg-[#5865F2]/10 flex items-center justify-center">
              <DiscordIcon className="h-5 w-5 text-[#5865F2]" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">Discord</p>
              <p className="text-xs text-zinc-500">Rich embeds for community and dev channels.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col gap-3 opacity-40 cursor-not-allowed">
            <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center">
              <Plus className="h-5 w-5 text-zinc-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Custom Webhook</p>
              <p className="text-xs text-zinc-600 italic">Coming soon: Raw JSON payloads.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
