# Project

**Multi-Tenant SaaS Starter**

A B2B SaaS starter boilerplate focusing on deep organization isolation and premium user experience.

## Current State: v3.0 (Enterprise & Scale) - [Shipped]

**Goal Accomplished:** Expanded upon the foundation with enterprise-level features including dynamic analytics, connectivity (API Keys & Webhooks), workflow engines, and member management.

### Shipped Features
- **Enterprise Landing Page**: GSAP ScrollTrigger features and benefits.
- **Dynamic Analytics**: Staggered UI dashboards and interactive charts.
- **Connectivity Ecosystem**: API Keys and Webhook registration.
- **Core Automations**: Workflow builder UI and background delivery service.
- **Member Management**: Data tables for members and invites.

<details>
<summary>Archived State: v2.0 (Productivity & Scale)</summary>

**Goal Accomplished:** Transformed the foundation into a high-engagement, reactive platform with usage transparency and enterprise-ready routing.

### Shipped Features
- **Real-time Notifications**: Upstash Redis infrastructure with SSE streaming for live updates.
- **Tenant Analytics**: Real-time quota tracking and dashboard visualization.
- **Enterprise Domains**: Custom domain support with Vercel Platforms API.
- **Audit Logging**: Comprehensive, tenant-isolated activity tracking.
- **Premium UI/UX**: Sub-route based settings navigation with GSAP fade-and-scale transitions.
</details>

## Current Milestone: v4.0 (Security & Integrations)

**Goal:** Elevar a plataforma a padrão enterprise com 2FA obrigatório, gestão de sessões ativas, e conectores nativos plug-and-play (Slack/Discord) sobre o motor de webhooks existente.

**Target features:**
- 2FA (TOTP) — Configuração por usuário + enforcement por organização
- Gestão de Sessões — Listar, revogar remotamente, expiração configurável
- Conectores Nativos — Slack e Discord com OAuth/Webhook simplificado
- Notificações de Eventos — Eventos do sistema disparam ações nos conectores

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

- [ ] 2FA (TOTP) com enforcement organizacional
- [ ] Gestão de sessões ativas com revogação remota
- [ ] Conectores nativos Slack & Discord
- [ ] Notificações de eventos via conectores

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
*Last updated: 2026-04-24 — Milestone v4.0 started*
