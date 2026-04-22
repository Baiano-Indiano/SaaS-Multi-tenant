# Requirements

High-level functional requirements for **Milestone v2.0 (Productivity & Scale)**.

## Tenant Analytics (PLG Focus)

- [x] **ANA-01**: Dashboard Usage Widgets.
  - *Description:* Gauge and progress bar indicators for current project/member counts vs plan limits.
  - *Logic:* Aggregate COUNT directly from tenant schema.
- [x] **ANA-02**: Real-time Limit Enforcement UI.
  - *Description:* Visual feedback (paywall toasts) when attempting to create projects beyond the plan quota.

## Real-time Notifications (Infrastructure)

- [x] **REK-01**: Upstash Redis Integration for Serverless WebSockets.
  - *Description:* Setup centralized Redis for handling pub/sub events.
- [x] **REK-02**: In-App Toast System.
  - *Description:* re-active UI component that displays system alerts and background task completion messages.

## Enterprise Domains (Routing)

- [x] **DOM-01**: Custom Domain Management UI.
  - *Description:* CRUD for custom domains within the organization settings.
- [x] **DOM-02**: Vercel Platforms API Integration.
  - *Description:* Programmatic domain addition and SSL management.
- [x] **DOM-03**: Domain Verification Workflow.
  - *Description:* Display DNS records (TXT/CNAME) for ownership verification.

## Team Activity & Audit Logs (Security)

- [x] **AUD-01**: Activity Log Database Table.
  - *Description:* Schema to store user actions (userId, action, entityId, metadata).
- [x] **AUD-02**: Organization Activity Feed UI.
  - *Description:* A "Recent Activity" view in the organization settings dashboard.
- [x] **AUD-03**: Automated Event Hooks.
  - *Description:* Server-side logic to trigger logs on project creation, member invites, and domain changes.

## Settings UI/UX (Experience)

- [x] **UI-01**: Sub-route based navigation.
  - *Description:* Move settings from tabs to dedicated URLs.
- [x] **UI-02**: Premium Transitions.
  - *Description:* Use GSAP for smooth route entry/exit animations.

---

*Archive: [v1.0 Requirements](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v1.0-REQUIREMENTS.md)*
