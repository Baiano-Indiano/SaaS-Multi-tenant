# Architecture Research

**Domain:** B2B Multi-Tenant SaaS
**Researched:** 2026-04-16
**Confidence:** HIGH

## Component Boundaries

### 1. Global / Auth Layer (Public Schema)
*   **Responsibilities:** Handles user identities, global sessions, organization master records, and billing status.
*   **Components:** `Users`, `Sessions`, `Accounts`, `Organizations`, `Memberships` tables.
*   **Boundary:** This layer is accessed globally. It acts as the routing layer to find "which tenant schema" a user is trying to access.

### 2. Tenant Layer (Isolated Schemas)
*   **Responsibilities:** All business logic, customer data, dynamic roles, and tenant-specific settings.
*   **Components:** `tenant_xyz.roles`, `tenant_xyz.permissions`, `tenant_xyz.[business_data]`.
*   **Boundary:** Code must explicitly establish a schema context (e.g. `db.withSchema('tenant_xyz')`) before querying this data.

### 3. Front-end (Next.js App Router)
*   **Public Site:** Landing pages, marketing, and pricing (Using Anime.js for hero section).
*   **App Dashboard:** Secured routes behind `(app)` group. Data fetching is done securely in Server Components reading the session's current Tenant context.

## Data Flow

1.  **Authentication:** User hits Next.js Auth endpoint → Session gets established via Better-Auth in public schema.
2.  **Organization Context:** User enters `/app/[orgSlug]`. Middleware or Layout verifies User has a `Membership` to `orgSlug` in the public schema.
3.  **Data Hydration:** Server Component initializes Drizzle DB instance specifically pointing to `schema: "tenant_[orgSlug]"`.
4.  **UI Render:** Data is passed to client components. Framer Motion handles dynamic state transitions for smooth UX.

## Suggested Build Order

1.  **Foundation:** Setup Next.js, Tailwind, Shadcn.
2.  **Landing Page:** Build the marketing facade with Anime.js "wow" factor to establish design tokens.
3.  **Database & Auth Schema:** Setup PostgreSQL, Drizzle ORM, and Better-Auth in the global `public` schema.
4.  **Organization Logic:** Build API/Actions to Create Organization, leading to dynamic creation of PostgreSQL schemas.
5.  **Multi-Tenant Gateway:** Build the middleware/routing to lock paths to `/org/[slug]` and bind DB context.
6.  **RBAC & Invites:** Implement dynamic roles and invitation tokens bounded to a specific tenant.

---
*Architecture research for: B2B Multi-Tenant SaaS App*
