# Quick Task: Fix Lint Errors

Fix ESLint errors and warnings across the codebase to make the build clean.

## Proposed Changes

We will address the following categories of lint problems:
1. **Explicit any types** (`@typescript-eslint/no-explicit-any`):
   - Replace `any` with precise types, `unknown`, or generic parameters where applicable.
2. **Unused variables** (`@typescript-eslint/no-unused-vars`):
   - Remove unused imports or variables, or prefix with `_` if they are part of a signature.
3. **`let` variables that are never reassigned** (`prefer-const`):
   - Change to `const`.

### Proposed Files to Modify

- `src/app/actions/data-import.ts`
- `src/app/actions/workflows.ts`
- `src/app/api/cron/billing-sync/route.ts`
- `src/app/api/org/[orgSlug]/export/route.ts`
- `src/app/api/org/[orgSlug]/reports/route.ts`
- `src/components/settings/integrations/event-mapping-dialog.tsx`
- `src/components/settings/workflows/workflow-builder.tsx`
- `src/components/settings/workflows/workflow-list.tsx`
- `src/lib/__tests__/rate-limit.test.ts`
- `src/lib/cache/l1-cache.ts`
- `src/lib/logger.ts`
- `src/lib/reports/__tests__/digest.test.ts`
- `src/lib/reports/__tests__/generator.test.ts`
- `src/lib/workflows/evaluator.ts`
- `tests/billing-sync.test.ts`
- `tests/slack-oauth.test.ts`
- `src/app/actions/__tests__/anomaly-detection.test.ts`
- `src/app/actions/__tests__/security-retention.test.ts`
- `src/app/(main)/[locale]/(app)/org/[orgSlug]/settings/domains/page.tsx`
- `src/app/actions/domains.ts`
- `src/app/api/notifications/stream/route.ts`
- `src/components/dashboard/InfraHealthMonitor.tsx`
- `src/components/settings/integrations/integrations-marketplace.tsx`
- `src/components/settings/integrations/teams-setup-dialog.tsx`

## Verification Plan

- Run `npm run lint` and verify zero errors/warnings.
- Run `npm run test:run` to ensure all unit tests remain functional.
