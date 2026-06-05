# Phase 42: Rate Limiting Dinâmico Baseado em Tier - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement dynamic tier-based rate limiting inside `src/proxy.ts` using Upstash Redis. The rate limits should reflect the customer's actual plan as managed by Stripe and cached in Redis, falling back to key-level metadata if cache is missing.

</domain>

<decisions>
## Implementation Decisions

### Cache and Fallback for Plan Resolution (Opção A)
- Store/Cache the organization's plan ID inside the Redis key `org:${orgId}` along with other metadata.
- In `src/proxy.ts`, read the organization's current plan dynamically from the cached `orgData` object.
- **Fallback:** If there is a cache miss on `org:${orgId}` in Redis/L1 Cache, default to `keyData.plan` (the plan active at the time the API key was created). Under no circumstances query the relational database synchronously during the request pipeline.

### Rate Limiting Window & Configuration
- Keep Upstash's native **Sliding Window** limiter over a 1-minute window to handle bursts cleanly.
- Add `PLANS.ENTERPRISE` with `rateLimit: 30000` (equivalent to 500 requests/second over a 1-minute sliding window) in `src/lib/billing/plans.ts`.
- Map the tier limiters dynamically inside `src/lib/rate-limit.ts` for the `enterprise` tier.

### Webhook & Sync Write-Through
- Update `src/app/api/webhooks/stripe/route.ts` and `src/app/api/cron/billing-sync/route.ts` to perform a write-through update of the Redis key `org:${orgId}` and `org:${orgSlug}` whenever an upgrade, downgrade, or cancellation is processed.
- Ensure the L1 cache is invalidated/updated dynamically to avoid edge caching lag.

### the agent's Discretion
- The exact layout of `orgCacheData` fields in Redis.
- Handling rate limit headers structure returned in the HTTP 429 response.
- Expiration time (TTL) for organization Redis keys.

</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/rate-limit.ts` -> Contains `getApiRateLimiter(planId)` and `tierLimiters` maps.
- `src/lib/redis.ts` -> Contains helpers like `getApiKeyFromRedis`.

### Established Patterns
- Redis organization cache format `org:${orgId}` is used for MFA checks (`require2FA`). We will extend this object to include the `plan` field.

### Integration Points
- `src/proxy.ts` -> L1 interceptor where API keys are authenticated and rate-limited.
- `src/app/api/webhooks/stripe/route.ts` -> Stripe webhook updates organization subscription data.
- `src/app/api/cron/billing-sync/route.ts` -> Cron job syncing billing details.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 42-rate-limiting-din-mico-baseado-em-tier*
*Context gathered: 2026-05-30*
