# Phase 10: Enterprise Domains (Vercel Platforms)

Enable custom domain mapping (`acme.com`) for organizations using the Vercel Platforms API. This phase focuses on the "Professional/Enterprise" tier value proposition, allowing organizations to maintain their own branding.

## User Decisions
- **Scope**: Exclusive focus on Custom Domains (no subdomains).
- **Verification**: Dedicated "Domains" UI with real-time DNS status check pinging Vercel API.
- **Paywall UX**: Soft-block via `PaywallProvider` (consistent with Phase 09).
- **DX**: Middleware-based "Mock Hostname" header for local development.

## Tech Stack & APIs
- **Middleware**: Next.js 15+ Native Middleware (`edge` runtime).
- **Vercel API**: `/v9/projects/${PROJECT_ID}/domains` for provisioning.
- **Database**: `public.organizations` schema update.
- **Verification**: TXT Record check for ownership + CNAME/A check for connectivity.

## Core Implementation Files
- `src/lib/db/schema.ts` (Database updates)
- `src/middleware.ts` (Routing & Rewrites)
- `src/lib/vercel/domains.ts` (API Client)
- `src/app/(app)/org/[orgSlug]/settings/domains/page.tsx` (Management UI)
- `src/app/actions/domains.ts` (Server Actions)

## Risks & Mitigations
- **Domain Squatting**: Mitigated by mandatory TXT record verification before SSL provisioning.
- **Vercel Rate Limits**: Implemented caching for DNS status checks.
- **SSL Propagation**: UX handles asynchronous "Pending" states with clear guidance.
