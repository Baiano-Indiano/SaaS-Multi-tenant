"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { UpgradeModal } from "./UpgradeModal";
import { PlanId } from "@/lib/billing/plans";

type PaywallContextType = {
    openPaywall: (options: { title: string; reason: string; requiredPlan?: PlanId }) => void;
};

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

export function PaywallProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [paywallData, setPaywallData] = useState<{ title: string; reason: string; requiredPlan?: PlanId } | null>(null);

    const openPaywall = (options: { title: string; reason: string; requiredPlan?: PlanId }) => {
        setPaywallData(options);
        setIsOpen(true);
    };

    return (
        <PaywallContext.Provider value={{ openPaywall }}>
            {children}
            {paywallData && (
                <UpgradeModal
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                    title={paywallData.title}
                    reason={paywallData.reason}
                    requiredPlan={paywallData.requiredPlan}
                />
            )}
        </PaywallContext.Provider>
    );
}

export const usePaywall = () => {
    const context = useContext(PaywallContext);
    if (!context) {
        throw new Error("usePaywall must be used within a PaywallProvider");
    }
    return context;
};
