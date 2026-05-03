# Phase 27: Sentry APM & Observability - Context

**Gathered:** 2026-05-03
**Status:** Retroactively Documented
**Source:** discuss-phase (retroactive)

<domain>
## Phase Boundary

Implementation of Sentry SDK for full-stack observability (Client, Server, Edge). Focuses on error tracking, performance monitoring (traces), and strict PII scrubbing to comply with LGPD/GDPR.
</domain>

<decisions>
## Implementation Decisions

### Observability & Tracing
- **Multi-Runtime SDK**: Initialize Sentry for Client, Server (Node.js), and Edge (Middleware/Proxy).
- **Sampling Strategy**: 100% traces in development, 10% in production to balance insight vs costs/overhead.
- **Proxy Integration**: Explicitly instrument `src/proxy.ts` using Sentry spans to monitor the performance of organization resolution and MFA checks.

### Security & Privacy (PII)
- **SendDefaultPii**: Set to `false`. Never send system-default PII (like server hostnames or full request objects) by default.
- **Client-Side Scrubbing**: Mask all input values and redactions in Session Replays. Remove IP addresses and emails from events.
- **Server-Side Scrubbing**: 
    - **Dual Strategy**: IPs are kept in internal DB audit logs for security, but removed/redacted in Sentry payloads.
    - **Aggressive Header Scrubbing**: Redact `Authorization`, `Cookie`, `Set-Cookie`, and `X-Forwarded-For`.
    - **Body Scrubbing**: Implement deep object traversal to redact keys containing `password`, `token`, `secret`, `card`, `stripe`, `mfa`, etc.
</decisions>

<canonical_refs>
## Canonical References

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
</canonical_refs>

<specifics>
## Specific Ideas

- Use `global-error.tsx` to catch failures in the root layout.
- Ensure Turbopack compatibility by following Next.js 15+ Sentry patterns.
</specifics>

<deferred>
## Deferred Ideas

- Sentry tunnel (to avoid ad-blockers).
- Slack/Discord alerting integration (deferred to infra setup).
</deferred>
