# Project

**Multi-Tenant SaaS Starter**

A B2B SaaS starter boilerplate focusing on deep organization isolation and premium user experience.

**Current State (2026-04-21):**
- **v1.0 (Foundation)**: SHIPPED. Core architecture (Next.js 15, Drizzle schema-per-tenant, Better-Auth, Dynamic RBAC, Stripe, Projects) is fully operational.
- **Next Goal**: v2.0 (Productivity & Scale).

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Authentication system (Better-Auth or Supabase Auth)
- [ ] Organization management (creation, joining)
- [ ] Member invitations workflow
- [ ] Dynamic customizable roles and permissions (RBAC/ABAC)
- [ ] High-impact landing page using Anime.js for hero animations
- [ ] Multi-tenant data architecture using Schema-per-tenant isolation

### Out of Scope

- Anime.js for standard React UI interactions — To avoid Virtual DOM conflicts, Framer Motion and native Tailwind transitions will be used for daily UI states (modals, dropdowns, routing).

## Context

- Building a modern 2025 stack framework to be reused for future SaaS products.
- Requires high visual polish ("wow factor" landing page).
- Needs to support serious B2B requirements right out of the box (isolated tenant databases via Postgres Schemas).

## Constraints

- **Tech Stack**: Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui.
- **Database Architecture**: PostgreSQL with Drizzle ORM (native schema support) implementing Schema-per-tenant logic.
- **Visual Design**: Premium aesthetic with Anime.js for landing page/hero moments, and Framer Motion/CSS for standard UI workflows.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router | Modern industry standard for React full-stack applications. | — Pending |
| Schema-per-tenant on PostgreSQL | Provides true data isolation mandated for enterprise/B2B products securely and scalably. | — Pending |
| Drizzle ORM | Native support for dynamic schemas unlike Prisma, essential for Schema-per-tenant pattern. | — Pending |
| Anime.js limited to high-impact views | Powerful timeline logic for wow-factor on static/landing pages, but risks fighting React's Virtual DOM in standard UI. | — Pending |

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
