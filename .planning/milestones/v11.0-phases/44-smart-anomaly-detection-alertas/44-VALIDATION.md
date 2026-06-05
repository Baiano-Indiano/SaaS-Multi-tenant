---
phase: 44
slug: smart-anomaly-detection-alertas
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-30
---

# Phase 44 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/app/actions/__tests__/anomaly-detection.test.ts` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/app/actions/__tests__/anomaly-detection.test.ts`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 44-01-01 | 01 | 1 | AI-01 | T-44-01 | Tracks MFA failure counting both 5m and 24h keys in Redis | unit | `npx vitest run src/app/actions/__tests__/anomaly-detection.test.ts` | ✅ | ✅ green |
| 44-01-02 | 01 | 1 | AI-01 | T-44-01 | Wrap authentication verification handlers to track failures asynchronously | unit | `npx vitest run src/app/actions/__tests__/anomaly-detection.test.ts` | ✅ | ✅ green |
| 44-01-03 | 01 | 2 | AI-02 | T-44-03 | Generate HTML anomaly email templates in dark-mode style | unit | `npx vitest run src/app/actions/__tests__/anomaly-detection.test.ts` | ✅ | ✅ green |
| 44-01-04 | 01 | 2 | AI-02 | T-44-03 | Send alerts with 30m cooldown and fallback to support email for adminless orgs | unit | `npx vitest run src/app/actions/__tests__/anomaly-detection.test.ts` | ✅ | ✅ green |
| 44-01-05 | 01 | 3 | AI-01 | T-44-02 | Trigger surge warnings on webhook surge in cron task secured by CRON_SECRET | unit | `npx vitest run src/app/actions/__tests__/anomaly-detection.test.ts` | ✅ | ✅ green |
| 44-01-06 | 01 | 4 | AI-01 | T-44-01 | Implement unit tests for all anomaly metrics and actions | unit | `npx vitest run src/app/actions/__tests__/anomaly-detection.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time MFA Alerting | AI-01 | Multi-request timing | Log in with invalid MFA 11 times in 5 minutes and verify that a warning email is sent to the organization's admin or support team. |
| Webhook Surge Verification | AI-01 | Database volume | Push >50 webhooks in an hour representing a surge over the 24h average and trigger `/api/cron/anomaly-detector` manually, checking for email dispatch. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-30
