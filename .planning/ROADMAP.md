# Roadmap

This roadmap tracks the evolution of the **Multi-Tenant SaaS Starter**.

---

## 🏁 Milestone v9.0 (Developer Experience & Scalability) - [In Planning]
**Goal:** Otimizar o workflow de desenvolvimento local e preparar a infraestrutura para escala e extensibilidade.

- [ ] **Phase 32: Quality Assurance & Core Testing** (TEST-01, TEST-02, TEST-03)
- [x] **Phase 33: Infrastructure Tooling & CLI** (TOOL-01, TOOL-02, TOOL-03)
- [ ] **Phase 34: Public API & Webhooks Foundation** (API-01, API-02, API-03)
- [ ] **Phase 35: Enterprise SSO & Domain Verification** (SSO-01, SSO-02, SSO-03)
- [ ] **Phase 36: Dashboard API Playground** (DX-01, DX-02, DX-03)
- [x] **Phase 37: Enterprise Security & Scalability** (SEC-01, SEC-02, SEC-03)

---

### Phase 32: Quality Assurance & Core Testing
**Goal:** Establish a robust automated testing suite for core flows and proxy security.
- [ ] Implement Playwright E2E for onboarding and organization switching.
- [ ] Implement Vitest unit tests for the `proxy.ts` gateway logic.
- [ ] Set up GitHub Actions CI pipeline for automated test execution.

### Phase 33: Infrastructure Tooling & CLI
**Goal:** Build internal CLI tools for tenant and organization management.
- [x] Create `cli/tenant` for schema management and migrations.
- [x] Create `cli/org` for member management and role updates via terminal.
- [x] Implement secure CLI authentication for internal developers.

### Phase 34: Public API & Webhooks Foundation
**Goal:** Formalize the public API and implement event-driven webhook notifications.
- [ ] Define public REST API standards and versioning (anchored in proxy).
- [ ] Build webhook event dispatcher and subscription management.
- [ ] Implement API Key management dashboard for tenants.

### Phase 35: Enterprise SSO & Domain Verification
**Goal:** Implement SAML/OIDC and domain verification for enterprise customers.
- [ ] Build domain ownership verification flow (DNS TXT records).
- [ ] Integrate SAML/OIDC via Better-Auth enterprise plugins.
- [ ] Implement enterprise-level auto-onboarding based on domain.

### Phase 36: Dashboard API Playground
**Goal:** Provide a developer playground directly in the tenant dashboard.
- [ ] Build interactive API explorer (Swagger/OpenAPI-like).
- [ ] Implement "Try it Out" functionality using live tenant API keys.
- [ ] Create developer documentation portal inside the app.

### Phase 37: Enterprise Security & Scalability
**Goal:** Implement critical enterprise features for compliance and high performance.
- [x] Build SIEM Integration with S3-compatible daily exports.
- [x] Configure Database Connection Pooling and Read Replica routing.
- [x] Implement Session Anomaly Detection with automated email alerts.

---


---

## 🏁 Milestone v8.0 (Enterprise Reliability & Security Hardening) - [Complete]
**Status:** Shipped 2026-05-03
**Archive:** [v8.0 Roadmap](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v8.0-ROADMAP.md)
**Audit:** [v8.0 Audit](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/v8.0-MILESTONE-AUDIT.md)

## 🏁 Milestone v7.0 (Global Enterprise & i18n) - [Complete]
**Status:** Shipped 2026-04-27
**Audit:** [v7.0 Audit](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/v7.0-MILESTONE-AUDIT.md)

## 🏁 Milestone v6.0 (Kinetic Brand & UX Refinement) - [Complete]
**Status:** Shipped 2026-04-26
**Audit:** [v6.0 Audit](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/v6.0-MILESTONE-AUDIT.md)

## 🏁 Milestone v5.0 (Enterprise Edge & DX) - [Complete]
**Status:** Shipped 2026-04-26
**Audit:** [v5.0 Audit](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/v5.0-MILESTONE-AUDIT.md)

---
*Last update: 2026-05-03*
