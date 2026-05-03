# Phase 31: Security Audit & CSP Hardening - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Source:** discuss-phase (interactive)

<domain>
## Phase Boundary

Final hardening of the application security layer. Implements a strict, nonce-based Content Security Policy (CSP), reinforces cookie/framing protections, and establishes automated security auditing patterns.
</domain>

<decisions>
## Implementation Decisions

### Content Security Policy (CSP)
- **Nonce-based Strategy**: Use unique, per-request nonces for `<script>` and `<style>` tags to prevent XSS. 
- **Middleware Injection**: Generate nonces in `src/proxy.ts` (Middleware) and inject them into the response headers.
- **Reporting**: Start in `Content-Security-Policy-Report-Only` mode.
- **Sentry Integration**: Pipe all CSP violations to Sentry using the `report-uri` directive to identify missing allowlist entries without blocking users.
- **Allowlist**: Explicitly allow Stripe, Sentry, and any external CDNs (e.g., Google Fonts).

### Framing & Cookies
- **Clickjacking Protection**: Use `frame-ancestors 'self'` in CSP as the primary defense, superseding `X-Frame-Options`.
- **Session Security**: Maintain `SameSite=Lax` for session cookies to preserve compatibility with SSO (OAuth) and Payment (Stripe) redirect flows.

### Security Auditing
- **Automated Scanning**: Integrate a lightweight scanner (e.g., `npm audit` or a specialized security tool) into the local dev/CI workflow.
- **OWASP Alignment**: Focus audit on the Top 10 vulnerabilities, specifically injection and broken access control.
</decisions>

<canonical_refs>
## Canonical References

- [Next.js CSP Documentation](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy)
- [Sentry: CSP Reporting](https://docs.sentry.io/product/security-reports-and-notifications/content-security-policy-reports/)
</canonical_refs>

<specifics>
## Specific Ideas

- The `proxy.ts` is the heart of our request lifecycle; it should be where we define the `nonce` and set the headers.
- We need to ensure that GSAP and Framer Motion don't break with the new policy (inline styles).
</specifics>

<deferred>
## Deferred Ideas

- Full `Content-Security-Policy` (Enforce) mode — deferred until violation reports in Sentry drop to zero.
- Subresource Integrity (SRI) for all external assets.
</deferred>
