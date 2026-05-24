# Phase 31: Security Audit & CSP Hardening

This phase focuses on hardening the application's security posture by implementing a strict, nonce-based Content Security Policy (CSP) and establishing automated security auditing practices. We will start in `Report-Only` mode to safely identify all required third-party resources before final enforcement.

## User Review Required

> [!IMPORTANT]
> **CSP Report-Only Mode**: The CSP will initially run in `Content-Security-Policy-Report-Only`. This means it will **not** block any content but will report violations to Sentry. We should monitor Sentry for at least 48-72 hours of production traffic before switching to enforcement mode.

> [!WARNING]
> **Inline Scripts/Styles**: Any components using inline `<script>` or `<style>` tags without the generated `nonce` will trigger violations. We will provide a utility to inject the nonce, but third-party libraries (like GSAP or Framer Motion) must be carefully allowlisted if they inject dynamic styles.

## Proposed Changes

### Core Security Middleware

#### [MODIFY] [proxy.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/proxy.ts)
- Implement `generateNonce()` utility.
- Construct the `Content-Security-Policy-Report-Only` header string.
- Include directives for:
  - `default-src 'self'`
  - `script-src 'self' 'nonce-{nonce}' 'strict-dynamic' https: 'unsafe-inline'` (standard strict CSP pattern)
  - `style-src 'self' 'unsafe-inline'` (allow for GSAP/Tailwind dynamic styles)
  - `img-src 'self' blob: data: https://*.sentry.io https://*.stripe.com`
  - `connect-src 'self' https://*.sentry.io https://*.stripe.com https://*.vercel-storage.com`
  - `frame-ancestors 'self'` (Clickjacking protection)
  - `report-uri` (Pointing to Sentry's security report endpoint)
- Inject the `nonce` into `requestHeaders` as `x-nonce` for use in Root Layout.

### Application Integration

#### [MODIFY] [layout.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/%5Blocale%5D/layout.tsx)
- Retrieve `x-nonce` from headers.
- Pass the `nonce` to the Next.js `<Script>` components and standard HTML elements where necessary.

#### [NEW] [security.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/lib/security.ts)
- Create a centralized security utility for CSP constant definitions and domain allowlisting.

### Automated Auditing

#### [NEW] [security-audit.yml](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/.github/workflows/security-audit.yml)
- Implement a GitHub Action for automated security scanning:
  - `npm audit` for dependency vulnerabilities.
  - Optional: Integration with a static analysis tool (e.g., SonarCloud or Snyk if tokens are provided).

## Verification Plan

### Automated Tests
- **CSP Header Check**: Verify that `Content-Security-Policy-Report-Only` is present in responses and contains a unique nonce for every request.
- **Nonce Consistency**: Ensure the nonce in the header matches the nonce injected into `<script>` tags in the HTML body.
- **Sentry Capture**: Manually trigger a CSP violation (e.g., trying to load a script from an unlisted domain) and verify it appears in Sentry's Security Reports.

### Manual Verification
- **Functional Audit**: Navigate through the Dashboard, Stripe Checkout, and Landings to ensure no legitimate features are "broken" by the policy (even in report-only mode, console errors should be noted).
- **Security Audit Script**: Run `npm audit` and resolve any "High" or "Critical" vulnerabilities in dependencies.
