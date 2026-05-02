import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { PLANS } from "@/lib/billing/plans";
import { recordAuditLog } from "@/lib/audit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	// @ts-expect-error - Stripe type definitions mismatches in this specific version
	apiVersion: "2025-02-24.acacia", 
});

import { sendNotification } from "@/lib/notifications";
import { members } from "@/lib/db/schema";

export async function POST(req: Request) {
	const body = await req.text();
	const signature = (await headers()).get("Stripe-Signature") as string;

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(
			body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET!
		);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Webhook signature verification failed.", message);
		return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
	}

	const session = event.data.object as Stripe.Checkout.Session;

	switch (event.type) {
		case "checkout.session.completed":
			const subscriptionId = session.subscription as string;
			const customerId = session.customer as string;
            const orgId = session.client_reference_id;
            const planId = session.metadata?.planId || "pro";

			if (orgId) {
				await db.update(organizations)
					.set({
						plan: planId,
						stripeCustomerId: customerId,
						stripeSubscriptionId: subscriptionId
					})
					.where(eq(organizations.id, orgId));
                
                console.log(`✅ Organization ${orgId} upgraded to ${planId}`);

                // Record Audit Log (Phase 11)
                await recordAuditLog({
                    organizationId: orgId,
                    action: "SUBSCRIPTION_CREATED",
                    entityType: "BILLING",
                    details: `Assinatura do plano ${planId} ativada via Stripe`,
                    actor: { id: "system", name: "Stripe Webhook", email: "billing@system.local" }
                });

				// Notify the organization
				// Find any member to get a valid userId (or we could use a system account)
				// For better UX, we could pass the user id back in metadata
				const member = await db.query.members.findFirst({
					where: eq(members.organizationId, orgId)
				});

				if (member) {
					await sendNotification({
						userId: member.userId,
						organizationId: orgId,
						type: "BILLING",
						title: "Subscription Activated!",
						message: `The organization has been successfully upgraded to the ${planId} plan.`,
						link: `/org/${orgId}/settings/billing`
					});
				}
			}
			break;

		case "customer.subscription.deleted":
		case "customer.subscription.updated":
			const subscription = event.data.object as Stripe.Subscription;
            
            // If the subscription is no longer active (past_due, canceled, etc)
            if (event.type === "customer.subscription.deleted" || 
               ['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
                
				const orgResult = await db.query.organizations.findFirst({
					where: eq(organizations.stripeSubscriptionId, subscription.id)
				});

				await db.update(organizations)
					.set({
						plan: "free",
					})
					.where(eq(organizations.stripeSubscriptionId, subscription.id));
                
				if (orgResult) {
					const member = await db.query.members.findFirst({
						where: eq(members.organizationId, orgResult.id)
					});
					if (member) {
						await sendNotification({
							userId: member.userId,
							organizationId: orgResult.id,
							type: "BILLING",
							title: "Subscription Cancelled",
							message: "The subscription has expired or was cancelled. The organization has been downgraded.",
						});
					}
				}

                console.log(`❌ Subscription ${subscription.id} downgraded to free`);

                if (orgResult) {
                    // Record Audit Log (Phase 11)
                    await recordAuditLog({
                        organizationId: orgResult.id,
                        action: "SUBSCRIPTION_DELETED",
                        entityType: "BILLING",
                        details: `Assinatura cancelada ou expirada. Downgrade para o plano Free.`,
                        actor: { id: "system", name: "Stripe Webhook", email: "billing@system.local" }
                    });
                }
            } else if (subscription.status === 'active') {
                // Handle upgrades/downgrades that happen inside Stripe customer portal
                const priceId = subscription.items.data[0].price.id;
                const newPlanId = Object.values(PLANS).find(p => p.priceId === priceId)?.id || "pro";

				const orgResult = await db.query.organizations.findFirst({
					where: eq(organizations.stripeSubscriptionId, subscription.id)
				});

                await db.update(organizations)
                    .set({
                        plan: newPlanId,
                    })
                    .where(eq(organizations.stripeSubscriptionId, subscription.id));
                
				if (orgResult) {
					const member = await db.query.members.findFirst({
						where: eq(members.organizationId, orgResult.id)
					});
					if (member) {
						await sendNotification({
							userId: member.userId,
							organizationId: orgResult.id,
							type: "BILLING",
							title: "Plan Updated",
							message: `Your subscription has been updated to the ${newPlanId} plan.`,
						});
					}
				}

                console.log(`🔄 Subscription ${subscription.id} updated to ${newPlanId}`);

                if (orgResult) {
                    // Record Audit Log (Phase 11)
                    await recordAuditLog({
                        organizationId: orgResult.id,
                        action: "SUBSCRIPTION_UPDATED",
                        entityType: "BILLING",
                        details: `Plano atualizado para ${newPlanId} via Stripe`,
                        actor: { id: "system", name: "Stripe Webhook", email: "billing@system.local" }
                    });
                }
            }
			break;
            
		default:
			console.log(`Unhandled event type ${event.type}`);
	}

	return new NextResponse(null, { status: 200 });
}
