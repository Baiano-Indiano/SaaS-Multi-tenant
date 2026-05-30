---
phase: 39
slug: oauth-integrations-marketplace-slack-teams
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-26
---

# Phase 39 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/lib/integrations` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/integrations`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 39-01-01 | 01 | 1 | INT-01 | T-39-01 | Verify state token signature stateless-ly | unit | `npx vitest run src/lib/integrations/__tests__/encryption.test.ts` | ✅ | ⬜ pending |
| 39-01-02 | 01 | 1 | INT-01 | T-39-02 | Encryption/decryption at-rest validation | unit | `npx vitest run src/lib/integrations/__tests__/encryption.test.ts` | ✅ | ⬜ pending |
| 39-01-03 | 01 | 1 | INT-02 | T-39-03 | Mock API response verification | unit | `npx vitest run src/lib/integrations/__tests__/teams.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/integrations/__tests__/encryption.test.ts` — stubs for INT-01 encryption
- [ ] `src/lib/integrations/__tests__/teams.test.ts` — stubs for INT-02 Graph client

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Slack App Installation | INT-01 | Requires active Slack workspace credentials and callback | Run local dev proxy and trigger Add to Slack OAuth handshake |
| MS Teams Webhook Posting | INT-02 | Requires live Microsoft Teams webhook URL config | Trigger test alert and check destination Microsoft Teams channel for message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-26
