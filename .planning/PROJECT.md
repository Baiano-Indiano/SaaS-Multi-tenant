# Project

**Multi-Tenant SaaS Starter**

A B2B SaaS starter boilerplate focusing on deep organization isolation and premium user experience.

## Current State: v8.0 (Enterprise Reliability & Security Hardening) - [Shipped]

**Goal Accomplished:** Transformed the application into a production-resilient platform with deep observability (Sentry), tenant-aware rate limiting, PII sanitization, and strict security headers (CSP).

### Shipped Features
- **Sentry APM**: Full observability in `proxy.ts` with PII scrubbing.
- **Rate Limiting**: Multi-tier protection (Auth/API) via Upstash/Redis.
- **PII Sanitization**: Recursive scrubbing of sensitive data in logs and traces.
- **Security Audit**: Automated OWASP scans and nonce-based CSP implementation.

## Current Milestone: v9.0 (Developer Experience & Scalability)

**Goal:** Otimizar o workflow de desenvolvimento local e preparar a infraestrutura para escala multi-região e expansão de API programática.

**Target features:**
- **Testing Expansion**: Suíte E2E (Playwright) e Unitários (Vitest) para core infra.
- **Tenant CLI**: Ferramentas para gestão de schemas e migrações.
- **Public API & Webhooks**: Autenticação via API Key no Proxy e fundação de eventos.
- **Scalability**: Estratégia de banco de dados multi-região.

## Requirements

### Validated

- [x] Authentication system (Better-Auth) [Phase 01]
- [x] Multi-tenant data architecture (Schema-per-tenant) [Phase 03]
- [x] Dynamic Customizable Roles (RBAC) [Phase 04]
- [x] High-impact landing page (GSAP) [Phase 01]
- [x] Real-time Notifications (Upstash) [Phase 08]
- [x] Tenant Analytics [Phase 09]
- [x] Enterprise Domains [Phase 10]
- [x] Audit Logs [Phase 11]
- [x] Sentry APM & Observability (Proxy + DB Tracing) [Phase 27]
- [x] Connection Pooling & Tenant Rate Limiting [Phase 28]
- [x] Compliance Hardening (PII masking in Audit Logs) [Phase 29]
- [x] GSAP Performance & Reduced Motion Logic [Phase 30]
- [x] Security Audit (OWASP) & CSP Hardening [Phase 31]

### Active

- [ ] **TEST-01**: Unit tests for proxy security logic (CSP/Nonce)
- [ ] **TEST-02**: E2E tests for tenant onboarding flows
- [ ] **TOOL-01**: CLI utility for schema management & migrations
- [ ] **API-03**: Proxy-based API Key Authentication with Rate Limiting
- [ ] **API-02**: Webhooks infrastructure (Event dispatcher)

## Constraints

- **Tech Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui.
- **Database Architecture**: PostgreSQL with Drizzle ORM implementing Schema-per-tenant logic.
- **Security**: Hardened security headers (HSTS, CSP, X-Frame-Options) via custom `proxy.ts`.
- **Visual Design**: Premium aesthetic with GSAP for landing page/hero moments, and GSAP/Framer Motion for standard UI workflows.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router | Modern industry standard for React full-stack applications. | Validated |
| Schema-per-tenant on PostgreSQL | Provides true data isolation mandated for enterprise/B2B products securely and scalably. | Validated |
| Drizzle ORM | Native support for dynamic schemas unlike Prisma, essential for Schema-per-tenant pattern. | Validated |
| GSAP for route transitions | High-end visual polish with controlled timeline logic. | Validated |
| Sub-route Settings | Better maintenance, isolation, and shareability of states. | Validated |
| Custom `proxy.ts` Gateway | Replaces deprecated Next.js Middleware for better control over security headers and nonces in Turbopack. | Validated |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-03 — Milestone v9.0 started*
