# Context: Phase 06 - Billing & Subscriptions

## Business Goal
Monetize the SaaS platform by offering paid plans (Pro, Enterprise) linked to organization entities.

## Technical Context
- **Tooling**: Stripe.
- **Data Model**: `organizations` table in `public` schema holds billing state.
- **Isolation**: Subscriptions are organization-wide, not user-specific.

## Requirements
- **BILL-01**: Integrated Stripe Checkout for upgrades.
- **BILL-02**: Webhook processing for lifecycle handling (renewals, cancellations).
