import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { BillingClient } from "@/components/billing/BillingClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
import { PLANS } from "@/lib/billing/plans";

interface BillingPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

export default async function BillingPage({
  params,
  searchParams,
}: BillingPageProps) {
  const { orgSlug } = await params;
  const { success, canceled } = await searchParams;

  const orgs = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, orgSlug));

  const org = orgs[0];

  if (!org) {
    return <div>Organização não encontrada.</div>;
  }

  const currentPlan = PLANS[org.plan.toUpperCase() as keyof typeof PLANS] || PLANS.FREE;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-4 md:p-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Plano e Faturamento
        </h1>
        <p className="text-muted-foreground text-lg">
          Gerencie a assinatura e os limites da sua organização. Atualmente no plano{" "}
          <span className="font-bold text-primary">{currentPlan.name}</span>.
        </p>
      </div>

      {success && (
        <Alert className="bg-emerald-500/10 border-emerald-500/50 text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Sucesso!</AlertTitle>
          <AlertDescription>
            Sua assinatura foi atualizada com sucesso. Pode levar alguns segundos para o sistema processar.
          </AlertDescription>
        </Alert>
      )}

      {canceled && (
        <Alert variant="destructive" className="bg-destructive/10">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Cancelado</AlertTitle>
          <AlertDescription>
            O processo de checkout foi cancelado. Nenhuma cobrança foi realizada.
          </AlertDescription>
        </Alert>
      )}

      <BillingClient orgSlug={orgSlug} currentPlanId={org.plan} />
      
      <div className="mt-12 p-6 rounded-2xl border bg-muted/30 backdrop-blur-sm">
        <h3 className="text-lg font-semibold">Precisa de algo mais?</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Para cancelamentos, notas fiscais ou alteração de método de pagamento, utilize o Portal de Faturamento do Stripe.
        </p>
        {/* We can add a Customer Portal button here later if stripeCustomerId is present */}
      </div>
    </div>
  );
}
