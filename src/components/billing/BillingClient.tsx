"use client";

import { useTransition } from "react";
import { useState } from "react";
import { PLANS } from "@/lib/billing/plans";
import { PlanCard } from "./PlanCard";
import { useToast } from "@/hooks/use-toast";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

interface BillingClientProps {
  orgSlug: string;
  currentPlanId: string;
}

export function BillingClient({ orgSlug, currentPlanId }: BillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackVariant, setFeedbackVariant] = useState<"error" | "info" | "success">("info");

  const handleUpgrade = async (priceId: string) => {
    setFeedback("Estamos abrindo o checkout seguro do Stripe...");
    setFeedbackVariant("info");
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
        setFeedback("Não foi possível iniciar o checkout. Tente novamente em alguns segundos.");
        setFeedbackVariant("error");
        toast({
          title: "Erro no Checkout",
          description: message || "Não foi possível redirecionar para o Stripe.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="mt-8 space-y-4">
      {feedback ? (
        <FeedbackBanner
          variant={feedbackVariant}
          title={feedbackVariant === "error" ? "Pagamento não iniciado" : "Processando"}
          message={feedback}
        />
      ) : null}
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
