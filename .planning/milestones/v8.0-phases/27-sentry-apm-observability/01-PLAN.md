# Phase 27: Sentry APM & Observability

Implementação completa do Sentry para monitoramento de erros e performance, com foco no `proxy.ts` (Next.js 16/Turbopack) e proteção de dados sensíveis (PII).

## Status
- **Status:** ✅ Complete
- **Last Updated:** 2026-05-02

## Tasks
- [x] Install `@sentry/nextjs`
- [x] Configure `sentry.server.config.ts`
- [x] Configure `sentry.client.config.ts`
- [x] Configure `sentry.edge.config.ts`
- [x] Create `src/instrumentation.ts` (runtime registration)
- [x] Integrate Sentry with `src/proxy.ts` (spans + error capture)
- [x] Implement PII scrubbing in `beforeSend`
- [x] Wrap `next.config.ts` with `withSentryConfig`
- [x] Create `global-error.tsx` error boundary
- [x] Add Sentry env vars to `.env.local`
- [x] Verify TypeScript compilation (0 Sentry errors)

## Files Created/Modified
- **NEW**: `sentry.client.config.ts` — Browser SDK + Replay + PII scrubbing
- **NEW**: `sentry.server.config.ts` — Node.js SDK + aggressive body/header scrubbing
- **NEW**: `sentry.edge.config.ts` — Edge runtime SDK for proxy.ts (20% sample rate)
- **NEW**: `src/instrumentation.ts` — Runtime registration + onRequestError
- **NEW**: `src/app/global-error.tsx` — Root error boundary with Sentry capture
- **MODIFIED**: `next.config.ts` — Wrapped with withSentryConfig (source maps, tree-shaking)
- **MODIFIED**: `src/proxy.ts` — Added Sentry spans for API auth, domain resolution, MFA enforcement
- **MODIFIED**: `.env.local` — Added SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT vars
