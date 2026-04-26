# Requirements

High-level functional requirements for **Milestone v4.0 (Security & Integrations)**.

## Security & Compliance (SEC)

- [x] **SEC-01**: User can enable 2FA (TOTP) via QR code in authenticator app
- [x] **SEC-02**: User receives backup/recovery codes when enabling 2FA
- [x] **SEC-03**: User can disable 2FA from their account settings
- [x] **SEC-04**: Org admin can enforce mandatory 2FA for all organization members
- [x] **SEC-05**: Members without 2FA see a setup interstitial on next login when enforcement is active
- [x] **SEC-06**: User can view all active sessions (device, IP, last active)
- [x] **SEC-07**: User can revoke a specific session
- [x] **SEC-08**: User can revoke all other sessions ("logout everywhere")
- [x] **SEC-09**: Org admin can revoke any member's sessions remotely

## External Connectors (CONN)

- [x] **CONN-01**: User can connect Slack to an organization via Webhook URL
- [x] **CONN-02**: User can connect Discord to an organization via Webhook URL
- [x] **CONN-03**: User can map system events (e.g., `member.joined`, `project.created`) to specific connectors
- [x] **CONN-04**: User can send a test message to verify a connector works
- [x] **CONN-05**: User can list, edit, and delete configured connectors
- [x] **CONN-06**: System delivers event notifications to connected services via QStash

## Enterprise Edge (SSO)

- [ ] **SSO-01**: Login corporativo via Google Workspace e Microsoft Entra ID (Azure AD)
- [ ] **SSO-02**: Verificação de domínio via DNS (TXT Records)
- [ ] **SSO-03**: Provisionamento automático de usuários (JIT) para domínios verificados

## Transparency & Monitoring (STAT)

- [ ] **STAT-01**: Página de status pública (`/status/[org-slug]`) acessível sem autenticação
- [ ] **STAT-02**: Visualização de logs de incidentes e status do sistema em tempo real
- [ ] **STAT-03**: Customização básica de branding (logo e nome) na página de status

## Developer Experience (DX)

- [ ] **DX-01**: Native API Playground (Scalar) integrated into dashboard
- [ ] **DX-02**: Automatic authentication using existing API Keys
- [ ] **DX-03**: Integrated code snippet generator (CURL, JS, Python)

## Visual Kinetic Overhaul (UI)

- [ ] **UI-01**: Apple-style entry staggers for landing page hero
- [ ] **UI-02**: Scroll-triggered reveals for feature sections
- [ ] **UI-03**: GSAP Flip transitions for dashboard widget layout changes
- [ ] **UI-04**: High-fidelity micro-interactions for core actions

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
| SEC-01 | 18 | ✅ Completed |
| SEC-02 | 18 | ✅ Completed |
| SEC-03 | 18 | ✅ Completed |
| SEC-04 | 18 | ✅ Completed |
| SEC-05 | 18 | ✅ Completed |
| SEC-06 | 19 | ✅ Completed |
| SEC-07 | 19 | ✅ Completed |
| SEC-08 | 19 | ✅ Completed |
| SEC-09 | 19 | ✅ Completed |
| CONN-01 | 20 | ✅ Completed |
| CONN-02 | 20 | ✅ Completed |
| CONN-03 | 20 | ✅ Completed |
| CONN-04 | 20 | ✅ Completed |
| CONN-05 | 20 | ✅ Completed |
| CONN-06 | 20 | ✅ Completed |
| SSO-01 | 21 | Planned |
| SSO-02 | 21 | Planned |
| SSO-03 | 21 | Planned |
| STAT-01 | 22 | Planned |
| STAT-02 | 22 | Planned |
| STAT-03 | 22 | Planned |
| DX-01 | 23 | Planned |
| DX-02 | 23 | Planned |
| DX-03 | 23 | Planned |
| UI-01 | 24 | Planned |
| UI-02 | 24 | Planned |
| UI-03 | 25 | Planned |
| UI-04 | 25 | Planned |

---
*Archive: [v3.0 Requirements](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v3.0-REQUIREMENTS.md)*
*Archive: [v2.0 Requirements](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v2.0-REQUIREMENTS.md)*
*Archive: [v1.0 Requirements](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v1.0-REQUIREMENTS.md)*
