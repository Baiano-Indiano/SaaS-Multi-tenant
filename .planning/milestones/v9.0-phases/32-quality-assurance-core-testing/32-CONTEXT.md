# Phase 32: Quality Assurance & Core Testing - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Source:** discuss-phase (interactive)

<domain>
## Phase Boundary

Establishment of a robust, Enterprise-grade automated testing suite. Focuses on critical business flows (Login/MFA, Tenant Switching, RBAC) using Playwright for E2E and Vitest for logic validation (Proxy/Rate Limiting). Includes CI/CD pipeline integration via GitHub Actions with ephemeral infrastructure.
</domain>

<decisions>
## Implementation Decisions

### 1. E2E Coverage Priorities (Playwright)
- **Critical Path Only**: Focus strictly on Login/MFA, Organization/Tenant Switching, and RBAC Boundaries (ensuring cross-tenant data leakage is impossible).
- **MFA Handling**: Use a static bypass/backup code for `test_*` users injected into the test database. This validates the full UI flow without the complexity of dynamic TOTP generation in CI.
- **Exclusions**: Skip minor UI validations (form styling, profile updates) to minimize "flaky" tests and execution time.

### 2. Proxy & Logic Testing (Vitest)
- **Proxy Gateway**: Test `src/proxy.ts` using fast integration tests with Vitest.
- **Mocking**: Use Vitest mocks for the Upstash Redis client. Mock responses (allow/deny) to verify the proxy returns HTTP 429 correctly.
- **CSP Validation**: Verify that the nonce-based CSP headers (defined in Phase 31) are correctly injected by the proxy.

### 3. Test Data Management
- **Master Test Tenant**: Use a static tenant (`e2e_acme_corp`) instead of creating/dropping schemas per test to maintain performance.
- **Seeding Strategy**: CI setup will run standard Drizzle migrations followed by a `seed.ts` script (using Drizzle ORM) to ensure type-safety and easier maintenance.
- **Cleanup**: Truncate or rollback mutable data (invites, logs) in `afterEach` hooks while keeping the tenant structure intact.

### 4. CI/CD Integration (GitHub Actions)
- **Gating**: 
    - **Vitest**: Run on every `push`.
    - **Playwright**: Run only on `pull_request` to `main` or `dev`.
- **Infrastructure**: Use the `services` directive in GitHub Actions to spin up an ephemeral PostgreSQL container (same version as production).
- **Automation**: Setup script must handle: DB Container → Migrations → Seed → Test Execution → Cleanup.
</decisions>

<canonical_refs>
## Canonical References

- [Playwright: Authentication Patterns](https://playwright.dev/docs/auth)
- [Vitest: Mocking Guide](https://vitest.dev/guide/mocking.html)
- [GitHub Actions: Using Databases in Workflows](https://docs.github.com/en/actions/using-containerized-services/creating-postgresql-service-containers)
- [Drizzle ORM: Seeding Documentation](https://orm.drizzle.team/docs/seed)
- `src/proxy.ts` (Core logic to test)
- `.planning/phases/31-security-audit-csp-hardening/31-CONTEXT.md` (CSP reference)
</canonical_refs>

<specifics>
## Specific Ideas

- Ensure `proxy.ts` tests cover the tenant-awareness of rate limits (limit per org ID).
- The `seed.ts` should create at least two organizations to test the switching flow and isolation.
- Use Playwright's `storageState` to share authentication between tests where appropriate, but re-authenticate for Tenant Switching flows.
</specifics>

<deferred>
## Deferred Ideas

- Visual Regression Testing (deferred to a future UI-specific phase).
- Performance/Load testing (beyond basic 429 validation).
- Cross-browser testing (start with Chromium/Headless only for CI efficiency).
</deferred>
