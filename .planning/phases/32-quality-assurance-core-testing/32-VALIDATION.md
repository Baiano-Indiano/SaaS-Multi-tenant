---
phase: 32
slug: quality-assurance-core-testing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-03
---

# Phase 32 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest & Playwright |
| **Config file** | vitest.config.ts, playwright.config.ts |
| **Quick run command** | `npm run test:run` |
| **Full suite command** | `npm run test:run && npx playwright test` |
| **Estimated runtime** | ~180 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:run`
- **After every plan wave:** Run `npm run test:run && npx playwright test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 240 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 32-01-01 | 01 | 0 | INFRA | - | N/A | setup | `npm test -- --version` | ✅ | ⬜ pending |
| 32-01-02 | 01 | 0 | SEED | - | N/A | setup | `ls src/db/seed-test.ts` | ❌ W0 | ⬜ pending |
| 32-02-01 | 02 | 1 | PROXY | T-32-01 | Rate limit enforcement | integration | `npm run test:run src/proxy.test.ts` | ❌ W0 | ⬜ pending |
| 32-03-01 | 03 | 2 | E2E-AUTH | T-32-02 | MFA bypass works | e2e | `npx playwright test tests/auth.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/db/seed-test.ts` — test data seeder
- [ ] `tests/proxy.test.ts` — proxy integration test stubs
- [ ] `tests/auth.spec.ts` — auth E2E test stubs
- [ ] `.github/workflows/quality-assurance.yml` — CI workflow skeleton

---

## Manual-Only Verifications

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 300s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
