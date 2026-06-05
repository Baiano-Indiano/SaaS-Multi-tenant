---
phase: 42
slug: rate-limiting-din-mico-baseado-em-tier
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-30
---

# Phase 42 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/lib/__tests__/rate-limit.test.ts` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/__tests__/rate-limit.test.ts`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 42-01-01 | 01 | 1 | FIN-03 | T-42-01 | Define PLANS.ENTERPRISE with rateLimit: 30000 | unit | `npx vitest run src/lib/__tests__/rate-limit.test.ts` | ✅ | ⬜ pending |
| 42-01-02 | 01 | 1 | FIN-03 | T-42-01 | getApiRateLimiter maps enterprise key correctly | unit | `npx vitest run src/lib/__tests__/rate-limit.test.ts` | ✅ | ⬜ pending |
| 42-01-03 | 01 | 2 | FIN-01 | T-42-01 | orgCacheData sets and updates the plan in Redis | unit | `npx vitest run src/app/actions/__tests__/org.test.ts` | ✅ | ⬜ pending |
| 42-01-04 | 01 | 2 | FIN-01 | T-42-01 | preserve plan configuration during 2FA toggle | unit | `npx vitest run src/app/actions/__tests__/org.test.ts` | ✅ | ⬜ pending |
| 42-01-05 | 01 | 2 | FIN-01 | T-42-01 | webhook updates org: Redis on checkout completion | unit | `npx vitest run src/lib/__tests__/rate-limit.test.ts` | ✅ | ⬜ pending |
| 42-01-06 | 01 | 3 | FIN-02 | T-42-02 | proxy resolves dynamic plan and falls back to key | unit | `npx vitest run src/lib/__tests__/rate-limit.test.ts` | ✅ | ⬜ pending |
| 42-01-07 | 01 | 4 | FIN-02 | T-42-02 | run tests for rate limiter and mock proxy behavior | unit | `npx vitest run src/lib/__tests__/rate-limit.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Webhook Stripe Sync | FIN-01 | Requires active stripe sandbox/signatures | Trigger test events in Stripe CLI dashboard and check Redis values for `org:${id}` plan field. |
| Burst rate limit (500req/s) | FIN-03 | Requires massive load-testing generator | Verify using autocannon against mock proxy endpoint with enterprise api token to check rate-limit headers. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-30
