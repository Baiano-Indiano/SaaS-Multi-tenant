# Pitfalls Research

**Domain:** B2B Multi-Tenant SaaS
**Researched:** 2026-04-16
**Confidence:** HIGH

## Critical Mistakes & Prevention

### 1. Cross-Tenant Data Leakage
*   **Warning Signs:** Developers manually adding `WHERE tenant_id = ?` to every query, risking forgetting it in one place.
*   **Prevention Strategy:** Use Schema-per-tenant isolation. Instead of filtering rows, point the Database ORM context directly to the tenant's exact schema (`SET search_path TO tenant_id`). This makes leaking cross-tenant data virtually impossible by accident.
*   **Relevant Phase:** Phase 1 (Database & Auth Foundation).

### 2. React Virtual DOM vs Direct DOM Manipulation
*   **Warning Signs:** UI flickering, unmounting bugs, or state desync when moving between Next.js routes.
*   **Prevention Strategy:** Isolate `Anime.js` completely to static/marketing pages where state changes are minimal. Wrap Anime.js logic in distinct `useEffect` hooks with proper cleanup functions. Use Framer Motion for strictly App-internal state management.
*   **Relevant Phase:** Phase 2 (Landing Page) & Phase 3 (App Dashboard UI).

### 3. Connection Pooling Exhaustion
*   **Warning Signs:** Database drops connections when querying across many dynamic schemas.
*   **Prevention Strategy:** Ensure Drizzle leverages a highly optimized serverless driver (like Neon/Postgres.js) and correctly scopes `withSchema` without spinning up a new physical DB connection per tenant.
*   **Relevant Phase:** Phase 1 (Database setup).

### 4. Brittle RBAC Systems
*   **Warning Signs:** Hardcoding `if (user.role === 'admin')` throughout the codebase, making it impossible to add custom roles later.
*   **Prevention Strategy:** Implement Action-based or Permission-based checks (`user.can('delete_invoice')`) instead of Role-based checks. Roles should strictly map to an array of Permissions.
*   **Relevant Phase:** Phase 4 (RBAC & Invites).

---
*Pitfalls research for: B2B Multi-Tenant SaaS App*
