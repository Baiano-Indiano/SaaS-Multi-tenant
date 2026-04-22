# Stack Research

**Domain:** B2B Multi-Tenant SaaS
**Researched:** 2026-04-16
**Confidence:** HIGH

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
| GSAP | 3.x/latest | Hero Animations | Industry standard for high-performance timelines and wow-factor interactions |
| Framer Motion| 11.x | UI Animations | Used strictly for App UI state (modals, dropdowns) to prevent VDOM clash |
| shadcn/ui | latest | UI Components | Pre-built accessible components built on Radix primitives |

## Installation

```bash
# Core
npm install next react react-dom drizzle-orm postgres tailwindcss @tailwindcss/postcss

# Auth & UI
npm install better-auth framer-motion clsx tailwind-merge lucide-react gsap

# Dev dependencies
npm install -D typescript @types/react @types/node drizzle-kit
```

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
| GSAP for standard App UI | Fights React VDOM if not handled with context/hooks; overkill for simple transitions | Framer Motion |

---
*Stack research for: B2B Multi-Tenant SaaS App*
