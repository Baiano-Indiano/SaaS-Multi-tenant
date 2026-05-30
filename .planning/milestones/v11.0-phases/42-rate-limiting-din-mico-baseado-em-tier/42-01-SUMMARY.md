---
phase: 42
slug: rate-limiting-din-mico-baseado-em-tier
status: complete
requirements_completed:
  - FIN-01
  - FIN-02
  - FIN-03
---
# Summary: Phase 42 - Rate Limiting Dinâmico Baseado em Tier

**Milestone:** v11.0
**Status:** Completed

## Narrative
Implemented dynamic B2B tenant-aware rate limiting in the L1 proxy. The proxy resolves limits by loading organization metadata from Upstash Redis (falling back to API key metadata to protect PostgreSQL from synchronous read path latency). Webhook and server actions perform immediate write-through updates of the organization Redis cache.

## Key Deliverables
- Enterprise plan with 30,000 req/min sliding window limit defined in `src/lib/billing/plans.ts`.
- Mapped `enterprise` limiter instance using `@upstash/ratelimit` in `src/lib/rate-limit.ts`.
- Integrated plan field in cached organization objects for org server actions and security toggles.
- Stripe webhook write-through caching implemented on subscription completion, updates, and deletes.
- Dynamic rate-limiting evaluation in L1 proxy checking `orgData.plan` first and falling back to `keyData.plan`.

## Verification Result
- Rate limiting resolution and fallback logic verified by unit tests in `src/lib/__tests__/rate-limit.test.ts`.
