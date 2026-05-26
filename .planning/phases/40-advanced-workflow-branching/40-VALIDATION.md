---
phase: 40
slug: advanced-workflow-branching
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-26
---

# Phase 40 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/lib/workflows` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/workflows`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 40-01-01 | 01 | 1 | WF-01 | T-40-01 | `json-rules-engine` filters evaluate payload matches correctly | unit | `npx vitest run src/lib/workflows/__tests__/evaluator.test.ts` | ✅ | ⬜ pending |
| 40-01-02 | 01 | 1 | WF-01 | T-40-02 | Terminate recursive execution when depth exceeds 5 | unit | `npx vitest run src/lib/workflows/__tests__/cascading.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Workflow UI rule creation | WF-01 | Requires active client-side builder dashboard interaction | Create and save conditional filter workflows in the browser settings UI, then trigger system actions to observe deliveries |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-26
