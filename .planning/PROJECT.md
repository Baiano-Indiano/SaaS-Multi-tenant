# Project

**Multi-Tenant SaaS Starter**

A B2B SaaS starter boilerplate focusing on deep organization isolation and premium user experience.

## Current State: v10.0 (Enterprise Integrations & Workflow Automation) - [Shipped]

**Goal Accomplished:** Expanded the connectivity ecosystem with pre-built Slack/Teams OAuth marketplace integrations, conditional notification routing, and automated activity digests with serverless telemetry.

### Shipped Features
- **Marketplace OAuth**: Connectors for Slack and Microsoft Teams with AES-256-GCM secure token encryption.
- **Conditional Workflows**: Event triggers matching payload fields using safe rules engine evaluations.
- **Scheduled Telemetry**: Serverless QStash-driven weekly email digests and PDF report compiler service.

## Current Milestone: v11.0 (Hybrid Enterprise)

**Goal:** Implement dynamic tier-based rate limiting, automatic data retention policies for GDPR compliance, and smart anomaly detection with proactive alerting.

**Target features:**
- **Dynamic Rate Limiting**: Tier-based rate limiting (proxy.ts + Upstash Redis) reading the customer's Stripe plan/tier.
- **Data Retention Policies**: Automated database cleanup/anonymization of audit logs (GDPR/LGPD) triggered by Upstash QStash.
- **Smart Anomaly Detection**: Lightweight event anomaly scanner (MFA spikes, webhook surges) with email alerting.


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
- [x] Quality Assurance & Core Testing [Phase 32]
- [x] Infrastructure Tooling & CLI [Phase 33]
- [x] Public API & Webhooks [Phase 34]
- [x] Enterprise SSO & Domain Verification [Phase 35]
- [x] Dashboard API Playground [Phase 36]
- [x] Enterprise Security & Scalability [Phase 37]
- [x] Infrastructure Robustness Hardening [Phase 38]
- [x] Slack OAuth App integration ("Add to Slack") [Phase 39]
- [x] Microsoft Teams OAuth integration [Phase 39]
- [x] Conditional filters for trigger workflow actions [Phase 40]
- [x] Weekly email digest with Resend [Phase 41]
- [x] PDF/JSON report generation service [Phase 41]
- [x] FIN-01: Dynamic tier-based rate limiting in proxy.ts using Upstash Redis linked to Stripe subscription plans [Phase 42]

### Active

- [ ] **SEC-01**: Automated data retention policy engine (GDPR/LGPD audit log cleanup/anonymization) via QStash.
- [ ] **AI-01**: Lightweight event anomaly detection (MFA failures, webhook surges) with email alerts.

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
*Last updated: 2026-05-30 — Phase 42 complete*
