import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Key, Webhook as WebhookIcon } from "lucide-react";
import { getApiKeysAction } from "@/app/actions/api-keys";
import { getWebhooksAction } from "@/app/actions/webhooks";
import { getRoles } from "@/lib/auth/rbac-utils";
import { ApiKeyList, type ApiKey } from "@/components/settings/api-keys/api-key-list";
import { WebhookList, type Webhook } from "@/components/settings/webhooks/webhook-list";
import { CreateWebhookDialog } from "@/components/settings/webhooks/create-webhook-dialog";
import { WorkflowList, type Workflow } from "@/components/settings/workflows/workflow-list";
import { WorkflowBuilder } from "@/components/settings/workflows/workflow-builder";
import { getWorkflowsAction } from "@/app/actions/workflows";
import { Separator } from "@/components/ui/separator";
import { Zap } from "lucide-react";

export default async function ConnectivitySettingsPage({
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

  const [apiKeys, webhooksData, workflowsData, roles] = await Promise.all([
    getApiKeysAction(org.id) as Promise<ApiKey[]>,
    getWebhooksAction(org.id) as Promise<Webhook[]>,
    getWorkflowsAction(org.id) as Promise<Workflow[]>,
    getRoles(org.id)
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Key className="h-5 w-5 text-zinc-400" />
          Connectivity Ecosystem
        </h3>
        <p className="text-sm text-zinc-400 mt-1">
          Manage API keys, webhooks and automations to integrate your organization with external services.
        </p>
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-zinc-200">API Keys</h4>
              <p className="text-xs text-zinc-500">
                Use these keys to authenticate requests to our API.
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
                Webhooks
              </h4>
              <p className="text-xs text-zinc-500">
                Receive real-time notifications about events in your organization.
              </p>
            </div>
            <CreateWebhookDialog orgId={org.id} orgSlug={org.slug || ""} />
          </div>
          <WebhookList 
            webhooks={webhooksData} 
            orgId={org.id} 
            orgSlug={org.slug || ""} 
          />
        </section>

        <Separator className="bg-zinc-800/50" />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 text-orange-500">
                <Zap className="h-4 w-4" />
                Automations (Workflows)
              </h4>
              <p className="text-xs text-zinc-500">
                Connect system triggers to external actions and webhooks.
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
