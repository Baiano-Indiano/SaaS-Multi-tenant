# Features Research

**Domain:** B2B Multi-Tenant SaaS
**Researched:** 2026-04-16
**Confidence:** HIGH

## Feature Categories

### 1. Table Stakes (Must Have)
Features that users absolutely expect. Without these, the B2B SaaS is not viable.

*   **Global Authentication:** Login, Registration, Password Reset, Magic Links.
*   **Organization Creation:** Users can create and manage their own "Tenants" or "Workspaces".
*   **Member Invitations:** Token-based or Email-based invitations to join an existing organization.
*   **Dynamic RBAC (Role-Based Access Control):** The ability to assign members into roles that determine page/action visibility.
*   **Strict Data Isolation:** Guarantee that Tenant A cannot read/mutate Tenant B data.
*   **User/Profile Settings:** Basic name, avatar, and preference management.

### 2. Differentiators (Competitive Advantage)
Features that make this starter stand out as premium.

*   **Custom Roles Creation:** Letting organizations define their own roles and map specific permissions to them instead of hardcoded `Admin`/`Member`.
*   **High-Wow Landing Page:** Using `Anime.js` for complex svg timeline animations in the hero section to immediately signal high quality.
*   **Schema-Per-Tenant Data Access:** Providing ultimate enterprise data safety out-of-the-box leveraging PostgreSQL schemas and Drizzle.
*   **Multi-Workspace Context Switching:** Fast, App-Router driven switching between different organizations the user is part of without re-authenticating.

### 3. Anti-Features (Do Not Build)
*   **Custom Domain Routing:** Wildcard domains (`tenant.saas.com`) introduce massive DNS and Edge middleware complexity for a starter. Keep isolation to path-based or context-based first.
*   **Full Anime.js UI Overrides:** Using Anime.js for App dashboard routes. It introduces lifecycle bugs in React. Stick to Framer Motion/CSS for App UI.

## Dependencies Between Features
*   **Invitations depend on RBAC:** When inviting a user, a role must be assigned to securely restrict them immediately upon joining.
*   **RBAC depends on Schema isolation:** The permission tables must be properly scoped either in a global schema referencing the tenant ID, or explicitly inside the tenant schema.

---
*Features research for: B2B Multi-Tenant SaaS App*
