"use client";

import { useTransition } from "react";
import { PLANS } from "@/lib/billing/plans";
import { PlanCard } from "./PlanCard";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface BillingClientProps {
  orgSlug: string;
  currentPlanId: string;
}

export function BillingClient({ orgSlug, currentPlanId }: BillingClientProps) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("Billing");

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
        throw new Error(errorData || t("checkoutError"));
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
        loading: t("loadingCheckout"),
        success: t("redirecting"),
        error: (err) => err instanceof Error ? err.message : t("checkoutError"),
      }
    );
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.values(PLANS).map((plan) => (
          <PlanCard
            key={plan.id}
            name={t(`plans.${plan.id}.name`)}
            description={t(`plans.${plan.id}.description`)}
            price={t(`plans.${plan.id}.price`)}
            features={t.raw(`plans.${plan.id}.features`)}
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
