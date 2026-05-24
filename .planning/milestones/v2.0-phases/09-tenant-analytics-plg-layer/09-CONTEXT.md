# Context: Phase 09 - Tenant Analytics (PLG Layer)

<domain>
Implement usage transparency for organization admins to drive PLG (Product-Led Growth). This includes analytics widgets on the dashboard and enforcement of plan-based quotas (members and projects) through a soft-block/upgrade workflow.
</domain>

<decisions>
## 1. Project Quotas
- **Free:** 3 projects
- **Starter:** 10 projects
- **Pro:** Ilimitado (999)
- *Rationale:* Standard B2B SaaS metric; 3 projects provide enough value to feel the platform's utility before hitting a wall.

## 2. Visual Style: Analytics Widgets
- **Choice:** Linear Progress Bars (Shadcn UI style).
- **Animation:** Use Framer Motion for smooth fill-up animations (0 to current value) on mount.
- **Aesthetic:** Monochromatic (Zinc) to align with "Modern Corporate" design system.

## 3. Paywall UX (Limit Enforcement)
- **Choice:** Soft-Block (Upgrade Modal).
- **Workflow:** Instead of disabling the "Create Project" button, the system allows the click but intercepts it with a premium Modal highlighting the benefits of the next plan and a CTA to Upgrade.

## 4. Data Fetching Strategy
- **Choice:** Real-time `count()`.
- **Reasoning:** Schema-per-tenant architecture ensures high performance for simple counting queries on indexed tables. Avoids premature optimization of cached counters/Sync logic.
</decisions>

<specifics>
- **Base Components:** Reuse and extend `src/components/dashboard/AnalyticsWidgets.tsx`.
- **Plans Definition:** Update `src/lib/billing/plans.ts` to include `maxProjects` field.
- **Modal Component:** Use `src/components/ui/dialog.tsx` for the upgrade modal.
- **Backend Enforcement:** Add validation in the project creation server action.
</specifics>

<deferred>
- **Historical Usage Graphs:** If the user wants to see usage over time, this will be handled in a future "Advanced Reporting" phase.
- **Usage Caching (Redis/Column):** Only if real-time counts become a bottleneck in the future.
</deferred>
