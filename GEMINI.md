<!-- GSD:project-start source:PROJECT.md -->
## Project

**Multi-Tenant SaaS Starter**

A B2B SaaS starter boilerplate focused on organization and access management. It provides authentication, organization creation, member invitations, and dynamic role-based access control (RBAC) to serve as a scalable foundation for future enterprise SaaS products.

**Core Value:** Secure, tenant-isolated data architecture with flexible organization management that accelerates the launch of enterprise-ready B2B applications.

### Constraints

- **Tech Stack**: Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui.
- **Database Architecture**: PostgreSQL with Drizzle ORM (native schema support) implementing Schema-per-tenant logic.
- **Visual Design**: Premium aesthetic with Anime.js for landing page/hero moments, and Framer Motion/CSS for standard UI workflows.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js App Router | 15.x | Fullstack Framework | Server Actions for fast B2B mutations and RSC for optimized dashboards |
| PostgreSQL | 16+ | Database | Essential for robust B2B `schema-per-tenant` data isolation logic |
| Drizzle ORM | 0.30+ | Data Access | First-class dynamic schema support, Edge-compatible, and type-safe |
| Tailwind CSS | v4.x | Styling | Utility-first with CSS native variables for quick theme scoping per-tenant |
| TypeScript | 5.x | Type Safety | Non-negotiable for robust B2B application scale |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Better-Auth | 1.x | Authentication | Best modern plugin-based auth. Great built-in organization logic. |
| Anime.js | 4.x/latest| Hero Animations | Wow-factor micro-interactions directly on marketing/landing pages |
| Framer Motion| 11.x | UI Animations | Used strictly for App UI state (modals, dropdowns) to prevent VDOM clash |
| shadcn/ui | latest | UI Components | Pre-built accessible components built on Radix primitives |
## Installation
# Core
# Auth & UI
# Dev dependencies
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js App Router | Remix / React Router | If standard web platform request/response lifecycle is preferred |
| Drizzle ORM | Prisma ORM | Only if RLS (Row Level Security) is used instead of isolated schemas |
| Better-Auth | Supabase Auth | If leveraging the full BaaS (Edge Functions, Storage) ecosystem |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Client-side pure React | Poor initial load performance, vulnerable auth flows | Next.js server components |
| Anime.js for App UI | Fights React VDOM and lifecycle hooks causing UI sync bugs | Framer Motion |
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
