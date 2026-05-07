# Requirements

High-level functional requirements for **Milestone v9.0 (Developer Experience & Scalability)**.

## Quality Assurance & Testing (TEST)

- [ ] **TEST-01**: Unit tests for proxy security logic (CSP, Nonce, Header Injection)
- [ ] **TEST-02**: E2E tests (Playwright) for tenant onboarding and organization switching
- [ ] **TEST-03**: Regression tests for RBAC permission enforcement on server-side routes

## Infrastructure CLI & Tooling (TOOL)

- [ ] **TOOL-01**: CLI script for local schema generation and tenant seeding
- [ ] **TOOL-02**: Batch migration utility to run Drizzle migrations across multiple tenant schemas
- [ ] **TOOL-03**: Database cleanup command for test environments

## Public API & Extensibility (API)

- [ ] **API-01**: System health check endpoint with database connection monitoring
- [ ] **API-02**: Event-driven Webhooks infrastructure (Table-based queue + worker)
- [ ] **API-03**: Proxy-based API Key authentication with Upstash rate limiting

## Enterprise Edge (SSO)

- [ ] **SSO-01**: Corporate login via Google Workspace and Microsoft Entra ID (Azure AD)
- [ ] **SSO-02**: Domain verification via DNS (TXT Records)
- [ ] **SSO-03**: Just-In-Time (JIT) provisioning for verified domains

## Developer Experience (DX)

- [ ] **DX-01**: Native API Playground (Scalar) integrated into dashboard
- [ ] **DX-02**: Automatic authentication using existing API Keys
- [ ] **DX-03**: Integrated code snippet generator (CURL, JS, Python)

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
| TEST-01 | 32 | Planned |
| TEST-02 | 32 | Planned |
| TEST-03 | 32 | Planned |
| TOOL-01 | 33 | Planned |
| TOOL-02 | 33 | Planned |
| TOOL-03 | 33 | Planned |
| API-01 | 34 | Planned |
| API-02 | 34 | Planned |
| API-03 | 34 | Planned |
| SSO-01 | 35 | Planned |
| SSO-02 | 35 | Planned |
| SSO-03 | 35 | Planned |
| DX-01 | 36 | Planned |
| DX-02 | 36 | Planned |
| DX-03 | 36 | Planned |

---
*Archive: [v4.0 Requirements](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v4.0-REQUIREMENTS.md)*
*Archive: [v3.0 Requirements](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v3.0-REQUIREMENTS.md)*
*Archive: [v2.0 Requirements](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v2.0-REQUIREMENTS.md)*
*Archive: [v1.0 Requirements](file:///c:/Users/Bernardo/Desktop/SaaS-Multi-tenant/.planning/milestones/v1.0-REQUIREMENTS.md)*
