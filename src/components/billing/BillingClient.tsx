"use client";

import { useTransition } from "react";
import { PLANS } from "@/lib/billing/plans";
import { PlanCard } from "./PlanCard";
import { useToast } from "@/hooks/use-toast";

interface BillingClientProps {
  orgSlug: string;
  currentPlanId: string;
}

export function BillingClient({ orgSlug, currentPlanId }: BillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleUpgrade = async (priceId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orgSlug,
            priceId,
          }),
        });

        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(errorData || "Falha ao iniciar checkout");
        }

        const { url } = await res.json();
        window.location.href = url;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Desconhecido";
        toast({
          title: "Erro no Checkout",
          description: message || "Não foi possível redirecionar para o Stripe.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {Object.values(PLANS).map((plan) => (
        <PlanCard
          key={plan.id}
          name={plan.name}
          description={plan.description || ""}
          price={plan.price}
          features={plan.features ? [...plan.features] : []}
          isPopular={plan.id === "starter"} 
          isCurrentPlan={currentPlanId === plan.id}
          isLoading={isPending}
          onSelect={() => plan.priceId && handleUpgrade(plan.priceId)}
        />
      ))}
    </div>
  );
}
