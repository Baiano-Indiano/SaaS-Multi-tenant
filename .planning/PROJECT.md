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

**Goal:** Otimizar o workflow de desenvolvimento local e preparar a infraestrutura para escala multi-região e expansão de API.

**Target features:**
- **Testing**: Expansão da suíte de testes E2E e unitários.
- **Tooling**: CLI para gerenciamento de tenants e migrações.
- **Scalability**: Estratégia de banco de dados multi-região.
- **Public API**: Fundação para API pública e webhooks externos.


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

### Active

- [ ] Sentry APM & Observability (Proxy + DB Tracing)
- [ ] Connection Pooling & Tenant Rate Limiting
- [ ] Compliance Hardening (PII masking in Audit Logs)
- [ ] GSAP Performance & Reduced Motion Logic
- [ ] Security Audit (OWASP) & CSP Hardening

## Constraints

- **Tech Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui.
- **Database Architecture**: PostgreSQL with Drizzle ORM implementing Schema-per-tenant logic.
- **Security**: Hardened security headers (HSTS, CSP, X-Frame-Options).
- **Visual Design**: Premium aesthetic with GSAP for landing page/hero moments, and GSAP/Framer Motion for standard UI workflows.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router | Modern industry standard for React full-stack applications. | Validated |
| Schema-per-tenant on PostgreSQL | Provides true data isolation mandated for enterprise/B2B products securely and scalably. | Validated |
| Drizzle ORM | Native support for dynamic schemas unlike Prisma, essential for Schema-per-tenant pattern. | Validated |
| GSAP for route transitions | High-end visual polish with controlled timeline logic. | Validated |
| Sub-route Settings | Better maintenance, isolation, and shareability of states. | Validated |

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
*Last updated: 2026-05-02 — Milestone v8.0 started*
