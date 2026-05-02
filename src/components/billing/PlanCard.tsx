"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface PlanCardProps {
  name: string;
  description: string;
  price: string;
  features: string[];
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  onSelect: () => void;
  isLoading?: boolean;
}

export function PlanCard({
  name,
  description,
  price,
  features,
  isPopular,
  isCurrentPlan,
  onSelect,
  isLoading,
}: PlanCardProps) {
  const t = useTranslations("Billing");

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className={cn(
        "relative h-full flex flex-col border-2 transition-all duration-300",
        isPopular ? "border-primary shadow-lg shadow-primary/10" : "border-border",
        isCurrentPlan && "bg-muted/50 border-muted-foreground/20"
      )}>
        {isPopular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
            {t("popular")}
          </div>
        )}

        <CardHeader>
          <CardTitle className="text-2xl">{name}</CardTitle>
          <CardDescription className="min-h-[40px]">{description}</CardDescription>
        </CardHeader>

        <CardContent className="flex-grow space-y-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold tracking-tight">{price}</span>
            <span className="text-muted-foreground text-sm font-medium">{t("perMonth")}</span>
          </div>

          <ul className="space-y-3">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            variant={isCurrentPlan ? "outline" : isPopular ? "default" : "secondary"}
            onClick={onSelect}
            disabled={isCurrentPlan}
            isLoading={isLoading}
          >
            {isCurrentPlan ? t("currentPlan") : t("subscribeNow")}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
