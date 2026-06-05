# Phase 32: Quality Assurance & Core Testing - Research

**Date:** 2026-05-03
**Status:** Complete

## 1. Testing Infrastructure Analysis

### Vitest (Integration/Logic)
- **Current State:** Configured in `vitest.config.ts` with `jsdom`.
- **Logic to Test:** `src/proxy.ts`, `src/lib/rate-limit.ts`, `src/lib/security.ts`.
- **Requirements:**
    - Mocks for `@upstash/redis` and `@upstash/ratelimit`.
    - Mock for `next/server` (NextRequest/NextResponse) to test the proxy function in isolation.
    - Integration tests for CSP header generation.

### Playwright (E2E)
- **Current State:** Configured in `playwright.config.ts`. Targets `npm run dev`.
- **CI Optimization:** On CI, we should use a production build to ensure we're testing the real artifact.
    - `command: 'npm run start'`
    - Pre-requisite: `npm run build`
- **Authentication:**
    - Use `storageState` to persist login for "standard" tests.
    - Create a dedicated login test for the MFA flow.

## 2. Test Data & Seeding Strategy

### Schema Requirements
- **Tenant:** `e2e_acme_corp` (slug: `acme-corp`).
- **User:** `test_admin@example.com` (role: `admin`).
- **MFA Bypass:** Inject a known hashed backup code into `user.twoFactorBackupCodes`.
    - Better-Auth typically uses bcrypt or similar for hashing. I need to verify the hashing algorithm used by Better-Auth for backup codes.
    - *Decision:* Use a static, pre-hashed backup code `test_backup_123` in the seed script.

### Seeding Script (`src/db/seed-test.ts`)
- Use Drizzle ORM to insert:
    1. A test organization with `require2FA: true`.
    2. A test user with `twoFactorEnabled: true`.
    3. A membership linking user to org with `admin` role.
    4. A second organization `e2e_globex` to test switching.

## 3. CI/CD Architecture (GitHub Actions)

### Workflow: `quality-assurance.yml`
- **Environment:** `ubuntu-latest`.
- **Services:** `postgres:16`.
- **Steps:**
    1. Checkout & Setup Node.
    2. Install dependencies.
    3. Build App (`npm run build`).
    4. DB Setup: `npx drizzle-kit push` (to service container).
    5. Seed: `npx tsx src/db/seed-test.ts`.
    6. Run Vitest: `npm run test:run`.
    7. Install Playwright Browsers.
    8. Run Playwright: `npx playwright test`.
    9. Upload Reports.

## 4. Verification Architecture (Nyquist Dimension 8)

| Component | Test Type | Tool | Success Criteria |
|-----------|-----------|------|------------------|
| Proxy Logic | Integration | Vitest | 429 returned on rate limit, CSP headers present |
| Auth Flow | E2E | Playwright | Successful login with MFA bypass code |
| Tenant Switch | E2E | Playwright | URL change and context header verification |
| RBAC Boundary | E2E | Playwright | 403 when accessing unauthorized org resources |

## 5. Dependencies & Blockers
- **Upstash Redis:** Must be mocked as we don't want CI hitting live Redis.
- **Better-Auth Secret:** Must be consistent between build and test.
- **Database Schema:** `npx drizzle-kit push` is faster for CI than running full migrations if the schema is fresh.

---
*Research complete. Proceeding to PLAN.md.*
