# Plan: Phase 06 - Billing & Subscriptions

## Objectives
Implement a complete billing cycle using Stripe and Drizzle.

## Proposed Changes
- Define `PLANS` constants in `src/lib/billing/plans.ts`.
- Create `/api/stripe/checkout` POST route to initiate Stripe Checkout sessions.
- Implement `/api/webhooks/stripe` to handle:
    - `checkout.session.completed` -> Upgrade org to paid plan.
    - `customer.subscription.updated/deleted` -> Sync plan changes.
- Build `/settings/billing` UI with `BillingClient` to display plans and handle upgrade flows.

## Verification
- Verified Stripe events using Local Stripe CLI.
- Verified organization state updates in PostgreSQL.
