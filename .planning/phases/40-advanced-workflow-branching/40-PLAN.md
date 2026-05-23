# Phase 40: Advanced Workflow Branching - Implementation Plan

Introduce conditional filters (rules engine) to the event-driven workflow builder. This allows organization admins to define filters (e.g. only notify Slack if a project name contains "critical") to optimize integration routing.

## User Review Required

> [!IMPORTANT]
> - Database schema: We will add a `filters TEXT` column to the `workflow` table inside tenant schemas. DDL migrations will automatically run for existing schemas when they are loaded or during CLI migration.
> - Evaluation Logic: Filter rules will be evaluated inside `emitEvent` (`src/lib/events.ts`) *before* pushing the delivery task to Upstash QStash. This avoids wasting QStash queue credits for workflows that don't match the conditions.
> - UI Component: The `WorkflowBuilder` dialog will have an additional step allowing the user to select condition parameters dynamically.

## Open Questions

> [!NOTE]
> Do we want to support nested "OR" groups of rules in the initial version, or is flat "AND" evaluation (all conditions must match) sufficient for the B2B enterprise MVP? We recommend flat "AND" logic first for simplicity and clean UX, then expanding if needed.

## Proposed Changes

---

### Database Schema Updates

#### [MODIFY] [schema.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/lib/db/schema.ts)
- Add `filters: text("filters")` field to the `workflows` table schema mapping.

#### [MODIFY] [tenant.ts](file:///c:/Users/Bernardo%20Multi-tenant/src/lib/db/tenant.ts)
- Add `"filters" TEXT` to the initial `CREATE TABLE workflow` SQL definition.
- Add an idempotent migration block inside `createTenantSchema`:
  `await sql\`ALTER TABLE \${sql(schemaName)}.workflow ADD COLUMN IF NOT EXISTS "filters" TEXT\`;`

---

### Core Workflow Engine

#### [NEW] [evaluator.ts](file:///c:/Users/Bernardo%20Multi-tenant/src/lib/workflows/evaluator.ts)
- Create a pure, unit-tested utility `evaluateWorkflowFilters(filtersJson: string | null, payload: any): boolean`.
- Implement operators: `equals`, `not_equals`, `contains`, `not_contains`, `exists`, `not_exists`.
- Handle safe property access for nested JSON structures (e.g. `payload.name`).

#### [MODIFY] [events.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/lib/events.ts)
- Import `evaluateWorkflowFilters` from `@/lib/workflows/evaluator`.
- In `emitEvent()`, query workflows including the new `filters` field.
- Iterate over matching active workflows and evaluate filters against the emitted event payload.
- Skip publishing to QStash if the conditions are not satisfied.

---

### API Actions & Validations

#### [MODIFY] [validations/index.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/lib/validations/index.ts)
- Update `createWorkflowSchema` to optionally parse `filters` (as string or array).

#### [MODIFY] [workflows.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/actions/workflows.ts)
- Update `createWorkflowAction` to accept and insert the `filters` field into the database.

---

### Frontend UI Updates

#### [MODIFY] [workflow-builder.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/settings/workflows/workflow-builder.tsx)
- Insert a new intermediate step (Step 2.5: Conditions) into the creation wizard.
- Provide form fields to configure a list of conditions:
  - Selector for the Event Field (populated based on trigger type, e.g., name, description, user).
  - Selector for the Operator (Equals, Contains, Exists).
  - Input field for the target Value.
- Serialize conditions as JSON and pass it to `createWorkflowAction`.

#### [MODIFY] [workflow-list.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/settings/workflows/workflow-list.tsx)
- Render badge indicators summarizing the workflow's active filter rules (e.g., `Filters: 2 rules`).

---

## Verification Plan

### Automated Tests
- Create unit tests in `tests/workflow-evaluator.test.ts` to test various condition logic, edge cases (missing payload keys), and operators.
- Create Vitest mocks for the updated `emitEvent` handler to verify that QStash tasks are skipped if filters don't match.

### Manual Verification
1. Go to settings, open Workflow Builder, and create a workflow with the trigger `project.created`.
2. Add a filter condition: `name contains "Critical"`.
3. Create a project named "Normal Project". Verify that no Slack/Discord notification is triggered.
4. Create a project named "Critical Security Fix". Verify that the Slack notification fires successfully.
