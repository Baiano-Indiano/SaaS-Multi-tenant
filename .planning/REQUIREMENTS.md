# Requirements

High-level functional requirements for **Milestone v4.0 (Security & Integrations)**.

## Security & Compliance (SEC)

- [ ] **SEC-01**: User can enable 2FA (TOTP) via QR code in authenticator app
- [ ] **SEC-02**: User receives backup/recovery codes when enabling 2FA
- [ ] **SEC-03**: User can disable 2FA from their account settings
- [ ] **SEC-04**: Org admin can enforce mandatory 2FA for all organization members
- [ ] **SEC-05**: Members without 2FA see a setup interstitial on next login when enforcement is active
- [ ] **SEC-06**: User can view all active sessions (device, IP, last active)
- [ ] **SEC-07**: User can revoke a specific session
- [ ] **SEC-08**: User can revoke all other sessions ("logout everywhere")
- [ ] **SEC-09**: Org admin can revoke any member's sessions remotely

## External Connectors (CONN)

- [ ] **CONN-01**: User can connect Slack to an organization via Webhook URL
- [ ] **CONN-02**: User can connect Discord to an organization via Webhook URL
- [ ] **CONN-03**: User can map system events (e.g., `member.joined`, `project.created`) to specific connectors
- [ ] **CONN-04**: User can send a test message to verify a connector works
- [ ] **CONN-05**: User can list, edit, and delete configured connectors
- [ ] **CONN-06**: System delivers event notifications to connected services via QStash

## Future Requirements (Deferred)

- OAuth "Add to Slack" flow (marketplace-level integration)
- Microsoft Teams connector
- Email digest connector
- Complex workflow branching logic

## Out of Scope

- Custom theme builders / tenant CSS — B2B prioritizes security over cosmetics
- Real-time collaboration (cursors, co-editing) — Excessive infrastructure complexity

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| SEC-01 | 18 | Planned |
| SEC-02 | 18 | Planned |
| SEC-03 | 18 | Planned |
| SEC-04 | 18 | Planned |
| SEC-05 | 18 | Planned |
| SEC-06 | 19 | Planned |
| SEC-07 | 19 | Planned |
| SEC-08 | 19 | Planned |
| SEC-09 | 19 | Planned |
| CONN-01 | 20 | Planned |
| CONN-02 | 20 | Planned |
| CONN-03 | 20 | Planned |
| CONN-04 | 20 | Planned |
| CONN-05 | 20 | Planned |
| CONN-06 | 20 | Planned |

---
*Archive: [v3.0 Requirements](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v3.0-REQUIREMENTS.md)*
*Archive: [v2.0 Requirements](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v2.0-REQUIREMENTS.md)*
*Archive: [v1.0 Requirements](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v1.0-REQUIREMENTS.md)*
