---
phase: 43
slug: pol-ticas-de-reten-o-de-dados-autom-ticas-gdpr-lgpd
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-30
---

# Phase 43 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/app/actions/__tests__/security-retention.test.ts` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/app/actions/__tests__/security-retention.test.ts`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 43-01-01 | 01 | 1 | SEC-01 | T-43-01 | Add dataRetentionDays integer column to schema.ts | unit | `npx vitest run src/app/actions/__tests__/security-retention.test.ts` | ✅ | ⬜ pending |
| 43-01-02 | 01 | 1 | SEC-01 | T-43-01 | Execute npx drizzle-kit push database sync | system | `npx drizzle-kit push` | ✅ | ⬜ pending |
| 43-01-03 | 01 | 2 | SEC-01 | T-43-01 | Enforce RBAC permission and minimum 7 days validation | unit | `npx vitest run src/app/actions/__tests__/security-retention.test.ts` | ✅ | ⬜ pending |
| 43-01-04 | 01 | 2 | SEC-01 | T-43-01 | Build data retention config react UI components | integration | `npx vitest run src/app/actions/__tests__/security-retention.test.ts` | ✅ | ⬜ pending |
| 43-01-05 | 01 | 2 | SEC-01 | T-43-01 | Mount component inside security settings page | integration | `npx vitest run src/app/actions/__tests__/security-retention.test.ts` | ✅ | ⬜ pending |
| 43-01-06 | 01 | 2 | SEC-01 | T-43-01 | Verify translations exists in both locale files | unit | `npx vitest run src/app/actions/__tests__/security-retention.test.ts` | ✅ | ⬜ pending |
| 43-01-07 | 01 | 3 | SEC-02 | T-43-02 | Run secure sweep daily cron using QStash receiver | unit | `npx vitest run src/app/actions/__tests__/security-retention.test.ts` | ✅ | ⬜ pending |
| 43-01-08 | 01 | 4 | SEC-02 | T-43-03 | Verify query execution and purge logic | unit | `npx vitest run src/app/actions/__tests__/security-retention.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Settings UI Form toggle | SEC-01 | Interactivity feedback visual checking | Click Data Retention toggle on Settings Dashboard. Verify input field displays, lock validation triggers under 7 days, and success toast displays on submit. |
| QStash Cron Execution | SEC-02 | Cron integration checking | Send mock POST to `/api/cron/cleanup-logs` with custom headers and check that database has expired rows purged. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-30
