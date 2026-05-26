# Roadmap

This roadmap tracks the evolution of the **Multi-Tenant SaaS Starter**.

---

## 🏁 Milestone v10.0 (Enterprise Integrations & Workflow Automation) - [Complete]
**Status:** Shipped 2026-05-26
**Goal:** Expand the integration ecosystem with pre-built OAuth flows and advanced workflow customization.
**Audit:** [v10.0 Audit](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/.planning/v10.0-MILESTONE-AUDIT.md)

- [x] **Phase 39: OAuth Integrations & Marketplace (Slack/Teams)**
- [x] **Phase 40: Advanced Workflow Branching**
- [x] **Phase 41: Email Digests & Automated Reporting**

---

### Phase 39: OAuth Integrations & Marketplace (Slack/Teams)
**Goal:** Transition from basic webhooks to first-class OAuth-based apps.
**Requirements:** INT-01, INT-02
**Success Criteria:**
1. Tenant admin can initiate "Add to Slack" flow, complete the authorization handshake, and see the integration status update to "Connected" on the dashboard.
2. Tenant admin can configure Microsoft Teams connector via Microsoft Graph OIDC flow.
3. Bot access tokens and credentials are encrypted (AES-256-GCM) at rest and physically isolated within the respective tenant's database schema.

### Phase 40: Advanced Workflow Branching
**Goal:** Make the workflow builder more dynamic and conditional.
**Requirements:** WF-01
**Success Criteria:**
1. Tenant admin can create event workflows and specify rules (e.g. filter by event payload fields).
2. Rule engine evaluates conditions securely using `json-rules-engine` without executing arbitrary code.
3. Cascading workflow rules terminate safely if execution depth exceeds a limit of 5, preventing infinite loops.

### Phase 41: Email Digests & Automated Reporting
**Goal:** Introduce scheduled telemetry and automated reporting.
**Requirements:** REP-01, REP-02
**Success Criteria:**
1. System runs a serverless cron job (via QStash) to compile weekly statistics and send them as an email digest via Resend.
2. Tenant admin can compile and download PDF/JSON reports on-demand or schedule them for automated delivery.
3. Report compilation runs asynchronously without blocking the Next.js API thread.

---

## 🏁 Milestone v9.0 (Developer Experience & Scalability) - [Complete]
**Status:** Shipped 2026-05-23
**Archive:** [v9.0 Roadmap](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v9.0-ROADMAP.md)
**Audit:** [v9.0 Audit](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/v9.0-MILESTONE-AUDIT.md)

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
*Last update: 2026-05-26*
