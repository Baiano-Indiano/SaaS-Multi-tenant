# Requirements

High-level functional requirements for **Milestone v2.0 (Productivity & Scale)**.

## Tenant Analytics (PLG Focus)

- [ ] **ANA-01**: Dashboard Usage Widgets.
  - *Description:* Gauge and progress bar indicators for current project/member counts vs plan limits.
  - *Logic:* Aggregate COUNT directly from tenant schema.
- [ ] **ANA-02**: Real-time Limit Enforcement UI.
  - *Description:* Visual feedback (paywall toasts) when attempting to create projects beyond the plan quota.

## Real-time Notifications (Infrastructure)

- [ ] **REK-01**: Upstash Redis Integration for Serverless WebSockets.
  - *Description:* Setup centralized Redis for handling pub/sub events.
- [ ] **REK-02**: In-App Toast System.
  - *Description:* re-active UI component that displays system alerts and background task completion messages.

## Enterprise Domains (Routing)

- [ ] **DOM-01**: Custom Domain Management UI.
  - *Description:* CRUD for custom domains within the organization settings.
- [ ] **DOM-02**: Vercel Platforms API Integration.
  - *Description:* Programmatic domain addition and SSL management.
- [ ] **DOM-03**: Domain Verification Workflow.
  - *Description:* Display DNS records (TXT/CNAME) for ownership verification.

## Team Activity & Audit Logs (Security)

- [ ] **AUD-01**: Activity Log Database Table.
  - *Description:* Schema to store user actions (userId, action, entityId, metadata).
- [ ] **AUD-02**: Organization Activity Feed UI.
  - *Description:* A "Recent Activity" view in the organization settings dashboard.
- [ ] **AUD-03**: Automated Event Hooks.
  - *Description:* Server-side logic to trigger logs on project creation, member invites, and domain changes.

---
*Archive: [v1.0 Requirements](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v1.0-REQUIREMENTS.md)*
