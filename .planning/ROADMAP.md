# Roadmap

This project follows a phased execution plan for **Milestone v4.0 (Security & Integrations)**.

---

## 🚀 Milestone v5.0 (Enterprise Edge & DX) - [In Planning]

### [Phase 21] Enterprise SSO (SAML/OIDC)
- **Goal:** Implement seamless onboarding via Google Workspace and Microsoft Entra ID.
- **Criteria:** Admin can verify domains via DNS and toggle JIT provisioning.
- **Depends on:** Phase 19
**Requirements:** SSO-01, SSO-02, SSO-03

**Success Criteria:**
1. Org admin can configure an OIDC/SAML provider (e.g., Google Workspace, Microsoft Entra).
2. Users can login via their company's SSO portal.
3. Support for JIT (Just-In-Time) provisioning of users within the organization.

---

### Phase 22: Public Status Pages
**Goal:** Enable tenants to publish a public status page for their projects/services.
**Depends on:** Phase 07 (Project Management), Phase 08 (Real-time Foundation)
**Requirements:** STAT-01, STAT-02, STAT-03

**Success Criteria:**
1. Tenants can toggle a public status page URL (e.g., `/status/[org-slug]`).
2. Page displays real-time health of projects/services based on system metrics.
3. Custom branding (logo, title) for the public page.

---

### Phase 23: Native API Playground
**Goal:** Provide an interactive DX experience for tenant developers using their API keys.
**Depends on:** Phase 15 (API Keys)
**Requirements:** DX-01, DX-02, DX-03

**Success Criteria:**
1. Built-in interactive playground (Scalar/Swagger) pre-authenticated with user's API keys.
2. Code snippet generator (CURL, JS, Python) for all available endpoints.
3. Integrated documentation for all tenant-accessible APIs.

---

## 🚀 Milestone v6.0 (Kinetic Brand & UX Refinement) - [In Planning]

### Phase 24: Apple-Style Landing Page Overhaul
**Goal:** Use GSAP to create high-end, minimalist scroll revelations and staggers.
**Requirements:** UI-01, UI-02

**Success Criteria:**
1. "Buttery-smooth" entry animations for all hero sections.
2. Sophisticated scroll-triggered reveals for product features.
3. Clean, minimalist typography staggers (no "flashy" distorsions).

---

### Phase 25: Dashboard Kinetic UX
**Goal:** Transition from static UI to a "living" dashboard using GSAP.
**Requirements:** UI-03, UI-04

**Success Criteria:**
1. Layout-aware transitions (GSAP Flip) when changing views or opening widgets.
2. Micro-interactions for primary actions (hover staggers, subtle focus states).
3. Optimized DOM-only performance (Zero Canvas/WebGL).

---

## 🏁 Milestone v4.0 (Security & Integrations) - [Complete]
**Status:** Shipped 2026-04-25
**Archive:** [v4.0 Roadmap](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v4.0-ROADMAP.md)

## 🏁 Milestone v3.0 (Enterprise & Scale) - [Complete]
**Status:** Shipped 2026-04-24
**Archive:** [v3.0 Roadmap](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v3.0-ROADMAP.md)

## 🏁 Milestone v2.0 (Productivity & Scale) - [Complete]
**Status:** Shipped 2026-04-22
**Archive:** [v2.0 Roadmap](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v2.0-ROADMAP.md)

## 🏁 Milestone v1.0 (Foundation) - [Complete]
**Status:** Shipped 2026-04-21
**Archive:** [v1.0 Roadmap](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v1.0-ROADMAP.md)

---
*Last update: 2026-04-25*
