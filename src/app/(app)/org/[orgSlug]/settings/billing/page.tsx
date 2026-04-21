"use client";

import { use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS } from "@/lib/billing/plans";
import { Check } from "lucide-react";
import { useState } from "react";

export default function BillingPage({
    params,
}: {
    params: Promise<{ orgSlug: string }>;
}) {
    const { orgSlug } = use(params);
    const [loading, setLoading] = useState<string | null>(null);

    const handleUpgrade = async (priceId: string) => {
        try {
            setLoading(priceId);
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
                throw new Error("Checkout failed");
            }

            const { url } = await res.json();
            window.location.href = url;
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-4 md:p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Billing & Plans</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your organization&apos;s subscription and billing details.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {Object.values(PLANS).map((plan) => (
                    <Card key={plan.id} className={plan.id === "pro" ? "border-primary shadow-md" : ""}>
                        <CardHeader>
                            <CardTitle className="text-2xl">{plan.name}</CardTitle>
                            <CardDescription>
                                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                                {plan.price !== "$0" && <span className="text-muted-foreground">/month</span>}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-primary" />
                                    <span>Up to {plan.maxMembers} members</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-primary" />
                                    <span>{plan.customRoles ? "Custom RBAC roles" : "Basic roles only"}</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-primary" />
                                    <span>Community Support</span>
                                </li>
                                {plan.id === "pro" && (
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span>Priority Support</span>
                                    </li>
                                )}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                variant={plan.id === "free" ? "outline" : "default"}
                                onClick={() => handleUpgrade("price_fake_id_" + plan.id)} // Replace with real price IDs
                                disabled={loading === "price_fake_id_" + plan.id || plan.id === "free"}
                            >
                                {loading === "price_fake_id_" + plan.id ? "Loading..." : plan.id === "free" ? "Current Plan" : "Upgrade"}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
