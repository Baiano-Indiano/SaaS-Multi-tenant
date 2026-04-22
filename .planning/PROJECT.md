# Project

**Multi-Tenant SaaS Starter**

A B2B SaaS starter boilerplate focusing on deep organization isolation and premium user experience.

## Current State: v2.0 (Productivity & Scale) - [Shipped]

**Goal Accomplished:** Transformed the foundation into a high-engagement, reactive platform with usage transparency and enterprise-ready routing.

### Shipped Features
- **Real-time Notifications**: Upstash Redis infrastructure with SSE streaming for live updates.
- **Tenant Analytics**: Real-time quota tracking and dashboard visualization.
- **Enterprise Domains**: Custom domain support with Vercel Platforms API.
- **Audit Logging**: Comprehensive, tenant-isolated activity tracking.
- **Premium UI/UX**: Sub-route based settings navigation with GSAP fade-and-scale transitions.

## Current Milestone: v3.0 (Planned)

**Goal:** *TBD*

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

- [ ] *Next milestone requirements to be defined.*

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

---
*Last updated: 2026-04-22 after v2.0 shipping*
