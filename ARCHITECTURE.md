# System Architecture: SaaS Multi-tenant

This document outlines the technical architecture and governance rules for the Multi-Tenant SaaS platform.

## 1. Data Isolation Strategy: Schema-per-Tenant

The platform implements **Hardened Multi-Tenancy** using a physical isolation strategy at the database schema level.

### Governance Rules (The 3 Rules)
1.  **Rule 1: Schema-Owner Validation**
    Every database request must verify if the `userId` belongs to the target `organizationId` within the `public` schema before switching context.
2.  **Rule 2: Contextual search_path**
    Tenant-specific operations must run within a database transaction that sets the `search_path` to the tenant's dedicated schema (e.g., `SET search_path TO tenant_abcd, public`).
3.  **Rule 3: Decoupled Objects**
    Tables inside tenant schemas (e.g., `project`, `role`) must not have physical Foreign Keys to the `public` schema. They use "Logical References" (matching IDs) to maintain portability and isolation.

### Implementation: `getTenantDb`
The core logic resides in `src/lib/db/tenant-db.ts`, which provides a type-safe wrapper for tenant-isolated queries.

## 2. Shared Data (Public Schema)

The `public` schema stores core system data that bridges tenants:
- **Users**: Authentication and profile data.
- **Organizations**: Metadata and billing-related state.
- **Memberships**: The link between Users and Organizations (used for Rule 1 validation).
- **Invitations**: Pending access requests.

## 3. Dynamic RBAC (Role-Based Access Control)

Roles are managed per-tenant, allowing organizations to define custom roles while inheriting system defaults.

- **System Roles**: `admin`, `member`, `viewer` (Immutable).
- **Custom Roles**: Created via the UI, stored in the tenant's `role` table.
- **Permissions**: Defined in `src/lib/auth/permissions.ts`. Synchronized between the custom role ID and Better-Auth's session metadata.

## 4. Tech Stack

- **Framework**: Next.js 16 (App Router).
- **Styles**: Tailwind CSS v4 + shadcn/ui.
- **Animations**: GSAP (Landing Page & Dashboard Transitions) & Framer Motion (App UI Modals/Dropdowns).
- **ORM**: Drizzle ORM (Primary) + raw `postgres.js` for dynamic schema operations.
- **Auth**: Better-Auth 1.1+.
## 5. Security Model: Defense in Depth (DiD)

The platform follows a multi-layered security architecture to prevent data leakage and authorization bypasses:

1.  **L1 - Proxy Layer (`src/proxy.ts`)**: The first line of defense handles lightweight redirects for unauthenticated users. It is optimized using direct server client calls to minimize latency.
2.  **L2 - Interface Layer (Server Layouts)**: Every protected layout re-verifies authentication and organization membership.
3.  **L3 - Data Access Layer (`getTenantDb`)**: The final and most secure layer. It enforces physical database isolation using `SET search_path` and re-validates organization membership before every transaction.

This model ensures that even if one layer is bypassed or misconfigured, data remain strictly isolated within its respective tenant schema.

## 6. Real-time Notification Engine

The platform uses persistent **Server-Sent Events (SSE)** for real-time updates without the overhead of WebSockets.

- **Reliability**: Integrated with **Upstash Redis** as a message broker.
- **Fan-out Architecture**: When an action (e.g. project creation) happens, the system publishes a message to a Redis channel corresponding to the organization.
- **Streaming**: The `src/app/api/notifications/stream/route.ts` endpoint listens to these channels and streams them to the client.
- **Scalability**: Stateless SSE allows the app to scale horizontally while Redis maintains data consistency across nodes.

## 7. PLG Layer & Quota Enforcement

Product-Led Growth (PLG) logic is enforced via a **Soft-Block** strategy.

- **Real-time Quotas**: Statistics are fetched in real-time using SQL `count()` on the isolated tenant schema, ensuring 100% accuracy for billing.
- **Premium Intercepts**: Instead of disabling UI features, the system allows the action attempt but intercepts it with an `UpgradeModal` (via `PaywallProvider`) when limits are hit.
- **Plan Scope**: Quota definitions are centralized in `src/lib/billing/plans.ts` and evaluated at both the Server Action level (for security) and the UI level (for UX).

## 8. Routing Conventions: Sub-routes vs Query Params

To maintain a premium, enterprise-grade user experience and clean codebase, the platform follows these routing rules:

- **Sub-routes (Primary)**: Used for functional transitions and separate business scopes (e.g., `/settings/general`, `/settings/members`). 
    - *Benefit*: Enables robust RBAC isolation per page, cleaner component structure, and deep-linking support.
- **Query Params (Secondary)**: Reserved for transient state within a single view (e.g., search filters `?q=...`, pagination `?page=2`, or temporary modal states).
    - *Benefit*: Instant navigation without full page mounting and easily shareable state for list views.

Standardizing on sub-routes for settings ensures that navigation transitions (GSAP Fade-and-Scale) are consistent across the administrative interface.

## 9. Bilingual Routing & Proxy Architecture

The platform implements a SEO-first bilingual strategy (EN/PT-BR) using `next-intl` integrated with a custom proxy handler.

- **Routing Model**: 
    - `src/app/(main)/[locale]`: Handles all application and marketing routes with locale prefixes.
    - `src/app/(public)`: Dedicated segment for status pages and public assets that bypass the locale requirement.
- **Proxy/Middleware Chain**:
    - The `src/middleware.ts` acts as a pass-through to `src/proxy.ts`.
    - **Proxy Logic**:
        1. **API v1 Intercept**: Authenticates API calls using API Keys + Redis metadata.
        2. **Tenant Resolution**: Resolves custom domains and organization slugs via Redis.
        3. **i18n Rewriting**: Injects the detected or default locale into the URL structure for Next.js to resolve localized segments without breaking core auth/api paths.
