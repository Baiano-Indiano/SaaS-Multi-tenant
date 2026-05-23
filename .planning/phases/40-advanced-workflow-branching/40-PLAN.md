# Phase 40: Advanced Workflow Branching - Implementation Plan

Introduce conditional filters (rules engine) with support for nested AND/OR logical groups in the event-driven workflow builder. This allows organization admins to define complex filters (e.g. notify Slack if a project name contains "Critical" AND the creator is "Admin" OR the priority is "High") to optimize integration routing.

## User Review Required

> [!IMPORTANT]
> - Database Schema: We will add a `filters TEXT` column to the `workflow` table inside tenant schemas. DDL migrations will automatically run for existing schemas when they are loaded or during CLI migration.
> - Evaluation Logic: Filter rules will be evaluated inside `emitEvent` (`src/lib/events.ts`) *before* pushing the delivery task to Upstash QStash. This avoids wasting QStash queue credits for workflows that don't match the conditions.
> - Complex Logic AST: The filters will be stored as a recursive JSON structure representing a Logical Tree of Conditions (AST) with AND/OR combinators.

## JSON Schema for Filters (Nested AST)

```typescript
export type FilterRule = {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'exists' | 'not_exists';
  value: string;
};

export type FilterGroup = {
  combinator: 'and' | 'or';
  rules: (FilterRule | FilterGroup)[];
};
```

Example payload:
```json
{
  "combinator": "and",
  "rules": [
    { "field": "payload.name", "operator": "contains", "value": "Critical" },
    {
      "combinator": "or",
      "rules": [
        { "field": "payload.description", "operator": "exists", "value": "" },
        { "field": "actor.role", "operator": "equals", "value": "administrator" }
      ]
    }
  ]
}
```

## Proposed Changes

---

### Database Schema Updates

#### [MODIFY] [schema.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/lib/db/schema.ts)
- Add `filters: text("filters")` field to the `workflows` table schema mapping.

#### [MODIFY] [tenant.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/lib/db/tenant.ts)
- Add `"filters" TEXT` to the initial `CREATE TABLE workflow` SQL definition.
- Add an idempotent migration block inside `createTenantSchema`:
  `await sql\`ALTER TABLE \${sql(schemaName)}.workflow ADD COLUMN IF NOT EXISTS "filters" TEXT\`;`

---

### Core Workflow Engine

#### [NEW] [evaluator.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/lib/workflows/evaluator.ts)
- Create a pure, recursively evaluated utility `evaluateWorkflowFilters(filtersJson: string | null, payload: any): boolean`.
- Implement tree traversal for nested rules and groups evaluating `combinator` logic (`and`/`or`).
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
- Update `createWorkflowSchema` to parse `filters` (validating the recursive JSON schema).

#### [MODIFY] [workflows.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/actions/workflows.ts)
- Update `createWorkflowAction` to accept and insert the `filters` field into the database.

---

### Frontend UI Updates

#### [MODIFY] [workflow-builder.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/settings/workflows/workflow-builder.tsx)
- Insert a new intermediate step (Step 2.5: Conditions) into the creation wizard.
- Provide a query builder component to add rules and create nested groups of rules (AND/OR combinators).
- Serialize conditions as JSON and pass it to `createWorkflowAction`.

#### [MODIFY] [workflow-list.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/settings/workflows/workflow-list.tsx)
- Render badge indicators summarizing the workflow's active filter rules (e.g., `Filters: 3 rules in 2 groups`).

---

## Verification Plan

### Automated Tests
- Create unit tests in `tests/workflow-evaluator.test.ts` to test deep nested condition trees, edge cases (missing keys), combinator transitions, and operators.
- Verify `emitEvent` execution tests by checking task submission filtering.

### Manual Verification
1. Open Workflow Builder and create a workflow with the trigger `project.created`.
2. Add a nested rule: `(name contains "Critical") AND (description exists OR creator is "Admin")`.
3. Create projects that match different nodes of the logic tree and verify notifications trigger correctly.
