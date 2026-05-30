# Phase 42 Verification: Rate Limiting Dinâmico Baseado em Tier

## Automated Verification
- [ ] **Limiter Mapping**: Verify `getApiRateLimiter` maps free, starter, pro, and enterprise plan IDs to their respective limiters.
- [ ] **Limiter Enforcement & Fallback**: Verify proxy resolves dynamic plan and falls back to key in case of cache misses.
- [ ] **Server Action Cache Update**: Verify org creation/update and 2FA toggles set or preserve plan key in cached org data.

## Manual Verification
- [ ] **Stripe Webhook Sync**: Trigger mock webhook calls (checkout completed, subscription updated, subscription deleted) and verify Redis cache update.
- [ ] **Bursty Enterprise limit**: Verify enterprise token handles burst rate limit up to 500 req/s.
