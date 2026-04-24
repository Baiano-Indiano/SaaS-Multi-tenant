# Roadmap

This project follows a phased execution plan for **Milestone v4.0 (Security & Integrations)**.

## 🚀 Milestone v4.0 (Security & Integrations) - [In Progress]

### Phase 18: Two-Factor Authentication (2FA)
**Goal:** Enable TOTP-based 2FA for user accounts with organizational enforcement.
**Depends on:** Phase 01 (Auth Foundation)
**Requirements:** SEC-01, SEC-02, SEC-03, SEC-04, SEC-05

**Success Criteria:**
1. User can enable 2FA from account settings and scan a QR code with any authenticator app
2. User receives and can regenerate backup/recovery codes
3. User can disable 2FA from settings (requires current TOTP verification)
4. Org admin can toggle "Require 2FA" for the organization
5. Members without 2FA see a mandatory setup interstitial when enforcement is active

---

### Phase 19: Session Management
**Goal:** Give users and admins full visibility and control over active sessions.
**Depends on:** Phase 18 (2FA must exist before session hardening)
**Requirements:** SEC-06, SEC-07, SEC-08, SEC-09

**Success Criteria:**
1. User can view a list of all active sessions with device info, IP, and last activity timestamp
2. User can revoke any specific session (logs out that device)
3. User can "logout everywhere" except the current session
4. Org admin can view and revoke any member's sessions from the member management page

---

### Phase 20: External Connectors (Slack & Discord)
**Goal:** Plug-and-play Slack and Discord integrations for event-driven notifications.
**Depends on:** Phase 15 (Webhooks infrastructure), Phase 16 (QStash event system)
**Requirements:** CONN-01, CONN-02, CONN-03, CONN-04, CONN-05, CONN-06

**Success Criteria:**
1. User can add a Slack connector by pasting a Webhook URL
2. User can add a Discord connector by pasting a Webhook URL
3. User can map system events (member.joined, project.created, etc.) to specific connectors
4. User can send a test message to verify the connector works
5. User can list, edit, and delete connectors from the integrations settings page
6. QStash reliably delivers event payloads to connected services with retry logic

---

- [ ] Phase 18: Two-Factor Authentication (2FA)
- [ ] Phase 19: Session Management
- [ ] Phase 20: External Connectors (Slack & Discord)

---

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
*Last update: 2026-04-24*
