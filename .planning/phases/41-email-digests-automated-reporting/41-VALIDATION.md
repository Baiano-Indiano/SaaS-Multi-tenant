---
phase: 41
slug: email-digests-automated-reporting
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-26
---

# Phase 41 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/lib/reports` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/reports`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 41-01-01 | 01 | 1 | REP-02 | T-41-01 | Compile PDF report buffer correctly on server | unit | `npx vitest run src/lib/reports/__tests__/generator.test.ts` | ✅ | ⬜ pending |
| 41-01-02 | 01 | 1 | REP-01 | T-41-02 | Gathers weekly metrics and formats email content correctly | unit | `npx vitest run src/lib/reports/__tests__/digest.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| On-demand PDF Download | REP-02 | Requires active file download prompt on settings dashboard | Click "Download PDF Report" on the Activity settings tab and verify page layout of the downloaded document |
| Resend Email Delivery | REP-01 | Requires active internet routing and verified domains | Trigger cron endpoint locally using simulated postman calls and verify receipt of activity digest in inbox |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-26
