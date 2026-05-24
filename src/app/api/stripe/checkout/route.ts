import { headers } from "next/headers";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PLANS } from "@/lib/billing/plans";
import { requirePermission } from "@/lib/auth/rbac-utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // @ts-expect-error - Stripe type definitions mismatches in this specific version
    apiVersion: "2025-02-24.acacia",
});

export async function POST(req: Request) {
    const _start = Date.now();
    logger.info('api', '➜ POST /api/stripe/checkout');

    try {
        const h = await headers();
        const session = await auth.api.getSession({ headers: h });

        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { orgSlug, priceId } = await req.json();

        if (!orgSlug || !priceId) {
            return new NextResponse("Missing parameters", { status: 400 });
        }

        // Resolve organization ID by slug
        const orgs = await db.select().from(organizations).where(eq(organizations.slug, orgSlug));
        const org = orgs[0];

        if (!org) {
            return new NextResponse("Organization not found", { status: 404 });
        }
        
        const orgId = org.id;

        // Verify the user is a member and has billing:manage permission
        await requirePermission(session.user.id, orgId, "billing:manage");

        const origin = h.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // Create Checkout Session
        const stripeSession = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId, 
                    quantity: 1,
                },
            ],
            success_url: `${origin}/org/${orgSlug}/settings/billing?success=true`,
            cancel_url: `${origin}/org/${orgSlug}/settings/billing?canceled=true`,
            client_reference_id: orgId,
            metadata: {
                orgId,
                planId: Object.values(PLANS).find((p: { priceId: string | null }) => p.priceId === priceId)?.id || "pro"
            }
        });

        logger.info('api', `✓ POST /api/stripe/checkout | 200 | ${Date.now() - _start}ms`);
        return NextResponse.json({ url: stripeSession.url });
    } catch (error) {
        logger.error('api', '✗ POST /api/stripe/checkout | Internal Server Error', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
