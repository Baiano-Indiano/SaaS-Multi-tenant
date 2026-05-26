import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Puzzle, Info, History, Settings2 } from "lucide-react";
import { getConnectorsAction } from "@/app/actions/connectors";
import { ConnectorList } from "@/components/settings/integrations/connector-list";
import { CreateConnectorDialog } from "@/components/settings/integrations/create-connector-dialog";
import { IntegrationsMarketplace } from "@/components/settings/integrations/integrations-marketplace";
import { DeliveryLogs } from "@/components/settings/integrations/delivery-logs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("Settings.integrations");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-zinc-400" />
            {t("title")}
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            {t("description")}
          </p>
        </div>
        <CreateConnectorDialog orgId={org.id} orgSlug={org.slug || ""} />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-zinc-900/40 border border-zinc-800/50 p-1 h-11">
          <TabsTrigger value="overview" className="gap-2 px-4 data-[state=active]:bg-zinc-800/50">
            <Settings2 className="h-3.5 w-3.5" />
            {t("tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2 px-4 data-[state=active]:bg-zinc-800/50">
            <History className="h-3.5 w-3.5" />
            {t("tabs.activity")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 pt-6 outline-none">
          <Alert className="bg-blue-500/5 border-blue-500/20 text-blue-400">
            <Info className="h-4 w-4" />
            <AlertTitle className="text-sm font-semibold">{t("alertTitle")}</AlertTitle>
            <AlertDescription className="text-xs opacity-80">
              {t("alertDesc")}
            </AlertDescription>
          </Alert>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-zinc-300">{t("activeConnections")}</h4>
            </div>
            <ConnectorList 
              connectors={connectorsData} 
              orgId={org.id} 
              orgSlug={org.slug || ""} 
            />
          </section>

          <Separator className="bg-zinc-800/50" />

          <section className="space-y-4">
            <h4 className="text-sm font-semibold text-zinc-300">{t("availableIntegrations")}</h4>
            <IntegrationsMarketplace orgId={org.id} orgSlug={org.slug || ""} />
          </section>
        </TabsContent>

        <TabsContent value="activity" className="pt-6 outline-none">
          <DeliveryLogs orgId={org.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
