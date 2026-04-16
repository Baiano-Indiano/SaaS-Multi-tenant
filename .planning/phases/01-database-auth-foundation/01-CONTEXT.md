# Phase 1: Database & Auth Foundation - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the core tech stack, global schemas (users/organizations), authentication using Better-Auth, and establish the isolation mechanisms for the multi-tenant architecture (schema-per-tenant pattern) using Drizzle ORM.
</domain>

<decisions>
## Implementation Decisions

### Registration Flow (Onboarding)
- **D-01:** Create the organization implicitly during the signup flow or immediately on first access.
- **D-02:** User that signs up becomes the owner of the organization automatically.
- **D-03:** Utilize Better-Auth's `organization` plugin for native management of organizations and members.

### Route Protection Pattern
- **D-04:** Use Next.js Middleware as the core gatekeeper to verify sessions globally.
- **D-05:** Middleware must validate session and tenant access before allowing requests to private tenant routes.

### Drizzle ORM Structure
- **D-06:** Implement proper schema-per-tenant separation relying on PostgreSQL schema isolation.
- **D-07:** Manage a `public` schema for global entities (Users, Accounts, Organizations) and dynamic schemas for tenant-specific data structures.
- **D-08:** Utilize Drizzle ORM correctly to support routing queries to the correct tenant schema at runtime.

### the agent's Discretion
- Basic implementation of sign-in/sign-up forms (just enough functional UI to test the auth flow).
- Specific folder structure for database connections and schema definitions.
- Utility functions to extract tenant ID from paths/headers.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Tech Stack
- `.planning/research/STACK.md` — Technology choices and alternatives.
- `.planning/research/ARCHITECTURE.md` — Explains the Global layer vs Tenant layer data flow isolation.
- `.planning/research/PITFALLS.md` — Pitfalls on cross-tenant data leakage.

</canonical_refs>

<specifics>
## Specific Ideas

- The forms should utilize Shadcn/UI and Tailwind CSS v4 to maintain a professional look from day one.
- Keep the setup as robust as possible for enterprise (B2B) security standards.
</specifics>

<deferred>
## Deferred Ideas

- Member invitations (planned for Phase 5)
- Dynamic RBAC configuration UI (planned for Phase 4)
- Complex landing page animations with Anime.js (planned for Phase 2)
</deferred>

---

*Phase: 01-database-auth-foundation*
*Context gathered: 2026-04-16*
