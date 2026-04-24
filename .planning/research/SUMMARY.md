# Research Summary — Milestone v4.0 (Security & Integrations)

**Researched:** 2026-04-24
**Confidence:** HIGH

## Stack Additions

| Library | Version | Purpose | Integration Point |
|---------|---------|---------|-------------------|
| Better-Auth `twoFactor` plugin | built-in | TOTP-based 2FA | Extends existing Better-Auth config |
| Better-Auth `admin` plugin | built-in | Revoke user sessions remotely | Extends existing Better-Auth config |
| Better-Auth `multiSession` plugin | built-in | List active device sessions | Extends existing Better-Auth config |
| `otpauth` / `@better-auth/totp` | latest | TOTP token generation & QR codes | Used internally by Better-Auth 2FA |
| `@slack/web-api` | latest | Slack Bot API (post messages) | Server-side only, Next.js Route Handlers |
| Discord Webhook API | native fetch | Post messages to Discord channels | Server Actions, no SDK needed |

**What NOT to add:**
- `@slack/bolt` — Overkill for our use case (outbound notifications only, not interactive bots)
- `next-auth` Discord provider — We use Better-Auth, not NextAuth
- Any TOTP library manually — Better-Auth's `twoFactor` plugin handles generation internally

## Feature Table Stakes

### Security & Compliance
| Feature | Category | Complexity |
|---------|----------|------------|
| User enables/disables 2FA (TOTP) | Table Stakes | Medium |
| QR code generation for authenticator apps | Table Stakes | Low (plugin handles it) |
| Backup/recovery codes | Table Stakes | Medium |
| Org admin enforces 2FA for all members | Differentiator | Medium |
| List active sessions (device, IP, last active) | Table Stakes | Low |
| Revoke specific session | Table Stakes | Low |
| Revoke all other sessions | Table Stakes | Low |
| Admin revokes member sessions remotely | Differentiator | Medium |

### External Connectors
| Feature | Category | Complexity |
|---------|----------|------------|
| Slack: Connect workspace via Webhook URL | Table Stakes | Low |
| Slack: OAuth "Add to Slack" flow | Differentiator | Medium |
| Discord: Connect channel via Webhook URL | Table Stakes | Low |
| Event routing: map system events → connectors | Table Stakes | Medium |
| Connector management UI (list, edit, delete, test) | Table Stakes | Medium |

## Key Architecture Decisions

1. **2FA via Better-Auth plugin** — No custom TOTP implementation. The `twoFactor` plugin provides `enableTwoFactor()`, `verifyTOTP()`, and `disableTwoFactor()` out of the box.

2. **Session management via Better-Auth core** — `revokeSession(token)`, `revokeSessions()`, and `revokeOtherSessions()` are built-in. The `admin` plugin adds `POST /admin/revoke-user-session` for org admin use.

3. **Slack integration: Webhook URL first, OAuth later** — Start with simple incoming webhook URLs (user pastes their Slack webhook). OAuth "Add to Slack" is a differentiator but adds complexity (redirect flow, token storage, scope management).

4. **Discord: Webhook URL only** — Discord webhooks require zero OAuth. User creates webhook in channel settings, pastes URL. We store it encrypted and POST to it via Server Actions.

5. **Connector abstraction** — Build a `ConnectorProvider` interface so Slack and Discord share the same contract: `{ type, config, sendNotification(event) }`. Future connectors (Teams, email) slot in easily.

6. **Event routing via existing QStash** — System events (`project.created`, `member.joined`) are already emitted by the workflow engine. Connectors subscribe to specific events and QStash handles reliable delivery.

## Watch Out For

1. **2FA enforcement timing** — When org admin enables mandatory 2FA, existing members without 2FA need a grace period (not instant lockout). Show a "Setup 2FA" interstitial on next login.

2. **Session table bloat** — Better-Auth stores sessions in DB. With multi-session support, rows accumulate. Add a cleanup cron or TTL-based expiry.

3. **Slack webhook URL security** — URLs contain secrets. Store encrypted in DB, never expose to client-side. Validate URL format before saving.

4. **Discord rate limits** — Discord webhooks have rate limits (30 requests/60 seconds per channel). QStash retry logic must respect `Retry-After` headers.

5. **TOTP clock drift** — TOTP tokens are time-based. Better-Auth handles a ±1 window by default, but document this for users whose device clocks are off.

6. **Connector test flow** — Always provide a "Send Test Message" button so users can verify their webhook URL works before saving. Prevents silent failures.

---
*Research synthesis for Milestone v4.0 (Security & Integrations)*
