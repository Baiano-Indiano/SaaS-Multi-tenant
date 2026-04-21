import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { PLANS } from "@/lib/billing/plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	// @ts-expect-error - Stripe type definitions mismatches in this specific version
	apiVersion: "2025-02-24.acacia", 
});

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
			}
			break;

		case "customer.subscription.deleted":
		case "customer.subscription.updated":
			const subscription = event.data.object as Stripe.Subscription;
            
            // If the subscription is no longer active (past_due, canceled, etc)
            if (event.type === "customer.subscription.deleted" || 
               ['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
                await db.update(organizations)
					.set({
						plan: "free",
					})
					.where(eq(organizations.stripeSubscriptionId, subscription.id));
                
                console.log(`❌ Subscription ${subscription.id} downgraded to free`);
            } else if (subscription.status === 'active') {
                // Handle upgrades/downgrades that happen inside Stripe customer portal
                const priceId = subscription.items.data[0].price.id;
                const newPlanId = Object.values(PLANS).find(p => p.priceId === priceId)?.id || "pro";

                await db.update(organizations)
                    .set({
                        plan: newPlanId,
                    })
                    .where(eq(organizations.stripeSubscriptionId, subscription.id));
                
                console.log(`🔄 Subscription ${subscription.id} updated to ${newPlanId}`);
            }
			break;
            
		default:
			console.log(`Unhandled event type ${event.type}`);
	}

	return new NextResponse(null, { status: 200 });
}
