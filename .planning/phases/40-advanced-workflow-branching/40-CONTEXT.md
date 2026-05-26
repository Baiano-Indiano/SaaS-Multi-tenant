# Phase 40: Advanced Workflow Branching - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers advanced conditional routing rules for event workflows. It integrates `json-rules-engine` to evaluate event payloads against admin-defined criteria securely and limits nested/cascading workflow depth to prevent resource exhaustion and infinite loops.

</domain>

<decisions>
## Implementation Decisions

### Rule Engine Integration
- **D-01:** The conditions evaluator (`src/lib/workflows/evaluator.ts`) will be rewritten to use `json-rules-engine`. The engine will parse the rules and evaluate them against the event payload.
- **D-02:** Filters will support matching on standard operators (equals, notEquals, contains, notContains, exists, notExists) mapped directly to `json-rules-engine` operators.

### Loop Prevention & Cascading Termination
- **D-03:** A depth tracking header (`X-Gravity-Depth`) will be propagated through QStash payloads and webhook headers. 
- **D-04:** The `emitEvent` helper in `src/lib/events.ts` will accept an optional `depth` parameter (defaulting to 0). If the depth exceeds the limit of 5, the execution terminates immediately and logs a security exception to prevent infinite recursive triggers.

### Frontend Rule Builder UI
- **D-05:** Enhance the workflow builder interface (`src/components/settings/workflows/workflow-builder.tsx`) to allow editing multi-level filter rules that match this new AST schema, supporting nested group logic.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/PROJECT.md` — Core value and tenant isolation principles
- `.planning/REQUIREMENTS.md` — Requirement WF-01 details
- `.planning/ROADMAP.md` — Phase 40 objectives and success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/workflows/evaluator.ts` — Existing evaluator structure, to be replaced by `json-rules-engine`.
- `src/lib/events.ts` — Main event hub triggering workflows and publishing to QStash.

</code_context>

<specifics>
## Specific Ideas

- Install `json-rules-engine` package for robust rule parsing.
- Propagate the execution depth value explicitly in `qstash-handler` payloads.

</specifics>

---
*Phase: 40-advanced-workflow-branching*
*Context gathered: 2026-05-26*
