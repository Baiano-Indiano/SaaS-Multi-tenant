# Phase 39: OAuth Integrations & Marketplace (Slack/Teams) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 39-OAuth Integrations & Marketplace (Slack/Teams)
**Areas discussed:** OAuth Callback Routing & State Security, Integration Token Encryption, Teams App Integration Strategy, Marketplace Settings UI Layout

---

## OAuth Callback Routing & State Security

| Option | Description | Selected |
|--------|-------------|----------|
| JWT state token | Signed stateless JWT in the `state` parameter containing userId/orgId | ✓ |
| Stateful Redis key | Short-lived random token mapped to session entry in Redis | |
| Active cookies only | Reading session cookies directly during callback | |

**User's choice:** Signed JWT in the 'state' parameter (self-contained, secure, stateless).

---

## Integration Token Encryption

| Option | Description | Selected |
|--------|-------------|----------|
| Node.js AES-256-GCM | Encrypt in Node using server key `CONNECTOR_SECRET` | ✓ |
| DDL pgcrypto | Encrypt in PostgreSQL via pgcrypto extension | |
| Plain text | Rely entirely on physical schema isolation | |

**User's choice:** AES-256-GCM in Node.js (secure, server-level secret, database-independent).

---

## Teams App Integration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Dual Graph/Webhook | Support both MS Graph Client OIDC flow and custom webhook URL fallback | ✓ |
| Graph API only | Full Graph Client integration only, requiring App registration | |
| Webhooks only | Custom incoming webhooks copy-paste setup only | |

**User's choice:** Support both Graph API OIDC flow and custom webhook fallback (maximum flexibility).

---

## Marketplace Settings UI Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Settings sub-route | Dedicated card grid under `/org/[slug]/settings/integrations` | ✓ |
| Connectivity tab | Embed directly inside the Connectivity settings tab | |
| Standalone Marketplace | Create separate marketplace section | |

**User's choice:** Integrations sub-route with a grid of cards and interactive setup drawers (clean, modular UI).

---

## Deferred Ideas
- Conditional event workflows filtering rules (Phase 40).
- Scheduled PDF/JSON telemetry digests and cron triggers (Phase 41).
