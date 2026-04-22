# Project

**Multi-Tenant SaaS Starter**

A B2B SaaS starter boilerplate focusing on deep organization isolation and premium user experience.

## Current Milestone: v2.0 (Productivity & Scale)

**Goal:** Transform the foundation into a high-engagement, re-active platform with usage transparency and enterprise-ready routing.

**Target features:**
- **In-App Real-time Notifications**: Upstash Redis + WebSocket/Polling for re-active UI.
- **Tenant Usage Analytics**: Dashboard widgets showcasing project/member quotas.
- **Custom Domains**: Vercel Platforms API integration for Enterprise tenants.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Authentication system (Better-Auth or Supabase Auth)
- [ ] Organization management (creation, joining)
- [ ] Member invitations workflow
- [ ] Dynamic customizable roles and permissions (RBAC/ABAC)
- [x] High-impact landing page using GSAP for hero animations
- [ ] Multi-tenant data architecture using Schema-per-tenant isolation

### Out of Scope

- GSAP for standard React UI interactions — To avoid Virtual DOM conflicts, Framer Motion and native Tailwind transitions will be used for daily UI states (modals, dropdowns, routing). GSAP is reserved for high-impact visual moments.

## Context

- Building a modern 2025 stack framework to be reused for future SaaS products.
- Requires high visual polish ("wow factor" landing page).
- Needs to support serious B2B requirements right out of the box (isolated tenant databases via Postgres Schemas).

## Constraints

- **Tech Stack**: Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui.
- **Database Architecture**: PostgreSQL with Drizzle ORM (native schema support) implementing Schema-per-tenant logic.
- **Visual Design**: Premium aesthetic with GSAP for landing page/hero moments, and Framer Motion/CSS for standard UI workflows.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router | Modern industry standard for React full-stack applications. | — Pending |
| Schema-per-tenant on PostgreSQL | Provides true data isolation mandated for enterprise/B2B products securely and scalably. | — Pending |
| Drizzle ORM | Native support for dynamic schemas unlike Prisma, essential for Schema-per-tenant pattern. | — Pending |
| GSAP limited to high-impact views | Powerful timeline logic for wow-factor on static/landing pages. Used with `gsap.context()` for React safety. | — Validated |

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
*Last updated: 2026-04-16 after initialization*
