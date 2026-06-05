# Plan: Phase 09 - Tenant Analytics (PLG Layer)

Implement usage transparency and quota enforcement.

## Tasks

### [ ] Engineering: Logic & Data
- [ ] Add `maxProjects` to `src/lib/billing/plans.ts`.
- [ ] Update `getDashboardStatsAction` in `src/app/actions/analytics.ts` to include limits.
- [ ] Update `createProjectAction` in `src/app/actions/projects.ts` with quota guard.

### [ ] UI: Components & Polish
- [ ] Add `src/components/ui/progress.tsx`.
- [ ] Create `src/components/billing/UpgradeModal.tsx`.
- [ ] Refactor `src/components/dashboard/AnalyticsWidgets.tsx` with Linear Progress + motion.

### [ ] Integration & DX
- [ ] Wire up `QUOTA_EXCEEDED` error to `UpgradeModal` trigger.
- [ ] Manual verification and smoke tests.
