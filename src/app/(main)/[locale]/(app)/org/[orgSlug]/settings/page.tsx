import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Settings, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrganizationSettingsForm } from "@/components/org/OrganizationSettingsForm";
import { getTranslations } from "next-intl/server";

import { GsapEntrance } from "@/components/ui/gsap-entrance";

export default async function GeneralSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; locale: string }>;
}) {
  const { orgSlug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Settings" });
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/login");

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) redirect("/selecionar-org");

  return (
    <div className="space-y-8 max-w-5xl">
      <GsapEntrance>
        <div>
          <h3 className="text-2xl font-bold text-zinc-100 flex items-center gap-2 tracking-tight">
            <Settings className="h-6 w-6 text-zinc-400" />
            {t("title")}
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            {t("description")}
          </p>
        </div>
      </GsapEntrance>

      <div className="grid gap-8">
        {/* Functional Forms */}
        <OrganizationSettingsForm 
          organization={{
            id: org.id,
            name: org.name,
            slug: org.slug || "",
          }} 
        />

        {/* Secondary Info Grid */}
        <GsapEntrance delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-zinc-950/40 border-zinc-900 shadow-lg">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t("subscriptionPlan")}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-zinc-200 font-medium capitalize">{org.plan || t("free")}</p>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 text-[10px] px-2 py-0">
                      {t("active")}
                    </Badge>
                  </div>
                </div>
                <Link 
                  href={`/org/${orgSlug}/settings/billing`}
                  className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-800 hover:bg-zinc-900 transition-colors"
                >
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400 cursor-pointer">
                    {t("manage")}
                  </Badge>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950/40 border-zinc-900 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t("orgId")}</p>
                  <p className="text-zinc-400 font-mono text-[11px] bg-zinc-900/50 px-2 py-1 rounded w-fit border border-zinc-800">
                    {org.id}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </GsapEntrance>

        {/* Coming Soon Card */}
        <GsapEntrance delay={0.3}>
          <Card className="bg-zinc-950/20 border border-zinc-900 border-dashed rounded-xl p-8 text-center">
            <CardContent className="p-0">
              <div className="mx-auto w-10 h-10 rounded-full bg-zinc-900/50 flex items-center justify-center mb-4 ring-1 ring-zinc-800">
                <Info className="h-5 w-5 text-zinc-600" />
              </div>
              <p className="text-xs text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
                {t("comingSoon")}
              </p>
            </CardContent>
          </Card>
        </GsapEntrance>
      </div>
    </div>
  );
}
