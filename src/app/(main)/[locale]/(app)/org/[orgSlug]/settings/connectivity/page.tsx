import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Key, Webhook as WebhookIcon } from "lucide-react";
import { getApiKeysAction } from "@/app/actions/api-keys";
import { getWebhooksAction } from "@/app/actions/webhooks";
import { getRoles, can } from "@/lib/auth/rbac-utils";
import { ApiKeyList, type ApiKey } from "@/components/settings/api-keys/api-key-list";
import { WebhookList, type Webhook } from "@/components/settings/webhooks/webhook-list";
import { CreateWebhookDialog } from "@/components/settings/webhooks/create-webhook-dialog";
import { WorkflowList, type Workflow } from "@/components/settings/workflows/workflow-list";
import { WorkflowBuilder } from "@/components/settings/workflows/workflow-builder";
import { getWorkflowsAction } from "@/app/actions/workflows";
import { Separator } from "@/components/ui/separator";
import { Zap } from "lucide-react";

import { getTranslations } from "next-intl/server";

export default async function ConnectivitySettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const t = await getTranslations("Settings.connectivity");
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/login");

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) redirect("/selecionar-org");

  const [apiKeys, webhooksData, workflowsData, roles, hasUpdatePermission] = await Promise.all([
    getApiKeysAction(org.id) as Promise<ApiKey[]>,
    getWebhooksAction(org.id) as Promise<Webhook[]>,
    getWorkflowsAction(org.id) as Promise<Workflow[]>,
    getRoles(org.id),
    can(session.user.id, org.id, "org:update")
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Key className="h-5 w-5 text-zinc-400" />
          {t("title")}
        </h3>
        <p className="text-sm text-zinc-400 mt-1">
          {t("description")}
        </p>
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-zinc-200">{t("apiKeys.title")}</h4>
              <p className="text-xs text-zinc-500">
                {t("apiKeys.description")}
              </p>
            </div>
          </div>
          <ApiKeyList 
            initialKeys={apiKeys} 
            roles={roles}
            orgId={org.id} 
            orgSlug={org.slug || ""} 
          />
        </section>

        <Separator className="bg-zinc-800/50" />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <WebhookIcon className="h-4 w-4" />
                {t("webhooks.title")}
              </h4>
              <p className="text-xs text-zinc-500">
                {t("webhooks.description")}
              </p>
            </div>
            {hasUpdatePermission && (
              <CreateWebhookDialog orgId={org.id} orgSlug={org.slug || ""} />
            )}
          </div>
          <WebhookList 
            webhooks={webhooksData} 
            orgId={org.id} 
            orgSlug={org.slug || ""} 
            hasUpdatePermission={hasUpdatePermission}
          />
        </section>

        <Separator className="bg-zinc-800/50" />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 text-orange-500">
                <Zap className="h-4 w-4" />
                {t("automations.title")}
              </h4>
              <p className="text-xs text-zinc-500">
                {t("automations.description")}
              </p>
            </div>
            <WorkflowBuilder orgId={org.id} orgSlug={org.slug || ""} />
          </div>
          <WorkflowList 
            workflows={workflowsData} 
            orgId={org.id} 
            orgSlug={org.slug || ""} 
          />
        </section>
      </div>
    </div>
  );
}
