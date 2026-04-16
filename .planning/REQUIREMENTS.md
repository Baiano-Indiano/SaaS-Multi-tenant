# Requirements: Multi-Tenant SaaS Starter

**Defined:** 2026-04-16
**Core Value:** Secure, tenant-isolated data architecture with flexible organization management that accelerates the launch of enterprise-ready B2B applications.

## v1 Requirements

### Authentication & Core

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User session persists across browser refresh (Better-Auth)
- [ ] **AUTH-03**: User profile management (name, email update)

### Organization Setup

- [ ] **ORG-01**: User can create a new organization
- [ ] **ORG-02**: Organization creation cascades to create a new dedicated schema in PostgreSQL
- [ ] **ORG-03**: User can switch active organization context without re-authenticating

### Member Invitations

- [ ] **INV-01**: Organization Admin can generate an invitation link for a new member
- [ ] **INV-02**: Invitations are bound to a specific PostgreSQL schema / Organization
- [ ] **INV-03**: User can accept invitation to join the organization

### Access Control (RBAC)

- [ ] **RBAC-01**: Organization Admin can create custom Roles within their organization
- [ ] **RBAC-02**: Admin can assign specific Permissions to custom Roles
- [ ] **RBAC-03**: Admin can assign Roles to organization Members
- [ ] **RBAC-04**: Edge/Middleware routes protect data based on Active Organization context and Permissions

### Frontend Experience

- [ ] **UI-01**: High-impact marketing Landing Page with Anime.js hero animations
- [ ] **UI-02**: App dashboard utilizes Framer Motion for state changes
- [ ] **UI-03**: Theme architecture utilizing Tailwind CSS v4 and shadcn/ui

## v2 Requirements

### Billing & Subscriptions
- **BILL-01**: Stripe integration for organization subscription plans
- **BILL-02**: Plan-based restriction on member limits

### Advanced Notifications
- **NOTF-01**: In-app WebSocket notification alerts

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom Domain Routing | `tenant.saas.com` adds too much Edge middleware and DNS complexity for a starter. Path-based routing `/org/[orgSlug]` is used. |
| Anime.js for App UI | Fights React VDOM and lifecycle hooks causing UI sync bugs. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| ORG-01 | Phase 2 | Pending |
| ORG-02 | Phase 2 | Pending |
| ORG-03 | Phase 2 | Pending |
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| RBAC-01 | Phase 4 | Pending |
| RBAC-02 | Phase 4 | Pending |
| RBAC-03 | Phase 4 | Pending |
| RBAC-04 | Phase 4 | Pending |
| INV-01 | Phase 5 | Pending |
| INV-02 | Phase 5 | Pending |
| INV-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-04-16*
*Last updated: 2026-04-16 after initial definition*
