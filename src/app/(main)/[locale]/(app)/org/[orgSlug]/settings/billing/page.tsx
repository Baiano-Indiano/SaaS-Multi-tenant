import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { BillingClient } from "@/components/billing/BillingClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface BillingPageProps {
  params: Promise<{ orgSlug: string; locale: string }>;
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

export default async function BillingPage({
  params,
  searchParams,
}: BillingPageProps) {
  const { orgSlug } = await params;
  const { success, canceled } = await searchParams;
  const t = await getTranslations("Billing");

  const orgs = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, orgSlug));

  const org = orgs[0];

  if (!org) {
    return <div>{t("notFound")}</div>;
  }

  const currentPlanName = t(`plans.${org.plan}.name`);

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-4 md:p-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t.rich("description", {
            planName: currentPlanName,
            span: (chunks) => <span className="font-bold text-primary">{chunks}</span>
          })}
        </p>
      </div>

      {success && (
        <Alert className="bg-emerald-500/10 border-emerald-500/50 text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>{t("success")}</AlertTitle>
          <AlertDescription>
            {t("successDescription")}
          </AlertDescription>
        </Alert>
      )}

      {canceled && (
        <Alert variant="destructive" className="bg-destructive/10">
          <XCircle className="h-4 w-4" />
          <AlertTitle>{t("canceled")}</AlertTitle>
          <AlertDescription>
            {t("canceledDescription")}
          </AlertDescription>
        </Alert>
      )}

      <BillingClient orgSlug={orgSlug} currentPlanId={org.plan} />
      
      <div className="mt-12 p-6 rounded-2xl border bg-muted/30 backdrop-blur-sm">
        <h3 className="text-lg font-semibold">{t("needHelp")}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t("stripePortal")}
        </p>
      </div>
    </div>
  );
}
