# Roadmap: Multi-Tenant SaaS Starter

**Created:** 2026-04-16

## Execution Strategy

Executing in **coarse** granularity with **parallelization** enabled.
This roadmap groups the 16 base requirements into 5 major phases.

---

## Phase 1: Database & Auth Foundation
**Goal:** Establish PostgreSQL schema-per-tenant architecture and Better-Auth foundation.
**Requirements:** AUTH-01, AUTH-02, AUTH-03

**Success Criteria:**
1. Drizzle ORM correctly points to `public` schema for global users.
2. Better-Auth endpoints (sign up, log in) correctly issue robust session tokens.
3. User profiling works on dummy accounts.

---

## Phase 2: Base UI & Landing Page (Theme Setup)
**Goal:** Implement the "Wow" factor Landing Page and Base layout structure.
**Requirements:** UI-01, UI-02, UI-03

**Success Criteria:**
1. Anime.js timelines function perfectly on the Landing page hero without un-mounting errors.
2. Next.js App Router sets up `(marketing)` and `(app)` route groups securely.
3. Framer Motion is active globally for layout transitions.

---

## Phase 3: Deep Multi-Tenant Context
**Goal:** Build organization structure and Database schema generation.
**Requirements:** ORG-01, ORG-02, ORG-03

**Success Criteria:**
1. Registering an organization drops a new Postgres schema via Drizzle push execution logic or manual SQL trigger.
2. The user can switch organization context which automatically routes them to `tenant_[xyz]` data safely.
3. Edge middleware prevents users passing the boundary of an organization they don't belong to.

---

## Phase 4: Dynamic RBAC
**Goal:** Implement granular roles and permissions logic within the tenant context.
**Requirements:** RBAC-01, RBAC-02, RBAC-03, RBAC-04

**Success Criteria:**
1. Organization Admin can define an unlimited dynamic array of `Roles` and specify `Permissions`.
2. Middleware / React hooks (`useCan`) natively read these dynamically without hardcoded limits.
3. Attempts to execute unauthorized `Server Actions` fail securely.

---

## Phase 5: Member Invitations
**Goal:** Invite users robustly tied to the correct schema.
**Requirements:** INV-01, INV-02, INV-03

**Success Criteria:**
1. Signed invitation tokens are bounded to the exact `[orgId]` and `[roleId]`.
2. Newly signed up members seamlessly join the specific schema environment via `Accept` flow.
3. Users receive clear feedback on pending vs accepted invites.

---
*Roadmap generated: 2026-04-16*
