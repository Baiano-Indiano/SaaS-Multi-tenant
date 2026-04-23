"use client";

import { useTransition } from "react";
import { PLANS } from "@/lib/billing/plans";
import { PlanCard } from "./PlanCard";
import { toast } from "sonner";

interface BillingClientProps {
  orgSlug: string;
  currentPlanId: string;
}

export function BillingClient({ orgSlug, currentPlanId }: BillingClientProps) {
  const [isPending, startTransition] = useTransition();

  const handleUpgrade = async (priceId: string) => {
    const action = async () => {
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
    };

    toast.promise(
      new Promise((resolve, reject) => {
        startTransition(async () => {
          try {
            await action();
            resolve(true);
          } catch (e) {
            reject(e);
          }
        });
      }),
      {
        loading: "Preparando checkout seguro do Stripe...",
        success: "Redirecionando...",
        error: (err) => err instanceof Error ? err.message : "Não foi possível iniciar o checkout.",
      }
    );
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </div>
  );
}
