# Phase 32: Quality Assurance & Core Testing - Plan

## Goal
Establish a robust, automated testing infrastructure and CI/CD pipeline to ensure high reliability and security of core multi-tenant flows.

---

## Wave 0: Infrastructure & Skeleton
*Focus: Setting up the environment, CI workflow, and test data seeding.*

- [ ] **Task 32-01-01: Create CI Workflow**
  - Create `.github/workflows/quality-assurance.yml` using `ubuntu-latest` and `postgres:16`.
  - Implement the "Pulo do Gato": `drizzle-kit push` -> `tsx src/db/seed-test.ts` -> `npm run build`.
  - **Verification:** Commit and check if the workflow triggers (it will fail at build/test but setup steps should pass).
- [ ] **Task 32-01-02: Implement Test Data Seeder**
  - Create `src/db/seed-test.ts`.
  - Provision tenant `acme-corp` and user `test_admin@example.com`.
  - **Decision:** Hardcode hashed backup code for `12345-67890` (investigate algorithm in Better-Auth during this task).
  - **Verification:** Run `npx tsx src/db/seed-test.ts` and verify data in DB via `src/scripts/debug-db.ts`.
- [ ] **Task 32-01-03: Setup Vitest Mocks & Config**
  - Update `tests/setup.ts` to include global mocks for `@upstash/redis` and `@upstash/ratelimit`.
  - Ensure `next/headers` and `next/server` are mocked for middleware/proxy testing.
  - **Verification:** Run `npm run test:run` (should pass with current empty/stub tests).

---

## Wave 1: Integration Testing (Security Logic)
*Focus: Testing the proxy.ts and security middleware.*

- [ ] **Task 32-02-01: Test Proxy Logic (`tests/proxy.test.ts`)**
  - Test `Rate Limiting` (ensure 429 returns when mock Redis says no).
  - Test `CSP Header Generation` (verify presence and structure).
  - Test `i18n Rewriting` (ensure locale injection works for protected routes).
  - **Verification:** `npm run test:run tests/proxy.test.ts`.

---

## Wave 2: E2E Testing (Critical Flows)
*Focus: Playwright tests for business-critical paths.*

- [ ] **Task 32-03-01: Auth & MFA Flow (`tests/auth.spec.ts`)**
  - Test standard login -> MFA Interstitial -> Backup Code entry (`12345-67890`).
  - Verify successful redirection to `/dashboard`.
  - **Verification:** `npx playwright test tests/auth.spec.ts`.
- [ ] **Task 32-03-02: Tenant Switching & RBAC Boundary (`tests/tenant.spec.ts`)**
  - Test organization switching via UI.
  - Verify access is denied (403 or redirect) when trying to access `e2e_globex` data with `acme-corp` session.
  - **Verification:** `npx playwright test tests/tenant.spec.ts`.

---

## Wave 3: Final Verification
*Focus: Full suite green and pipeline sign-off.*

- [ ] **Task 32-04-01: Full Suite Execution**
  - Run full suite locally: `npm run test:run && npx playwright test`.
  - Fix any flakiness in E2E tests.
  - **Verification:** All tests green.
- [ ] **Task 32-04-02: CI Pipeline Sign-off**
  - Ensure `.github/workflows/quality-assurance.yml` passes completely on GitHub.
  - **Verification:** Green checkmark on GitHub Actions.

---

## Done When
- [ ] CI pipeline is functional and automated on every PR to `main` and `dev`.
- [ ] 100% coverage on critical security logic in `proxy.ts`.
- [ ] Core B2B flows (Login, MFA, Tenant Switch) verified by Playwright.
- [ ] No secrets leaked in repository (using static test values).
- [ ] Nyquist validation for Phase 32 is signed off.
