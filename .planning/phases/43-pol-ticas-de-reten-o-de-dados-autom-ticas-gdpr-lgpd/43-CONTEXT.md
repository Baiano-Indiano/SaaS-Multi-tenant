# Phase 43: Políticas de Retenção de Dados Automáticas (GDPR/LGPD) - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement data retention policy configuration in the organization security settings page, allowing administrators to define the number of days audit logs are kept. Implement a scheduled serverless cron job using Upstash QStash to execute a daily hard delete sweep of audit logs older than the configured period in each tenant schema.

</domain>

<decisions>
## Implementation Decisions

### UI Integration & Database Settings
- **D-01 (UI Placement):** Configure data retention on the existing organization security page (`src/app/(main)/[locale]/(app)/org/[orgSlug]/settings/security/page.tsx`). Add a card called "Políticas de Retenção de Dados" with a form allowing toggle activation and entry of retention days.
- **D-02 (Database Column):** Add a nullable integer column `dataRetentionDays` to the `organizations` table in `src/lib/db/schema.ts` (null or 0 indicates infinite retention).
- **D-03 (Valores Padrão & Lock):** Keep retention disabled (infinite) by default. If enabled by the user, enforce a validation rule requiring a minimum of 7 days in both UI forms and server actions to prevent accidental bulk data loss.

### Back-end Cleanup & Execution
- **D-04 (Hard Delete):** Execute hard delete of expired rows from the dynamic tenant schema `audit_log` table:
  `DELETE FROM "${tenantSchema}".audit_log WHERE "createdAt" < NOW() - INTERVAL '${retentionDays} days'`
- **D-05 (QStash Cron Trigger):** Create a secure daily cron endpoint `/api/cron/cleanup-logs` validated by Upstash QStash receiver signatures.
- **D-06 (Batch Sweep Execution):** The cron sweeps all organizations in public database with `dataRetentionDays IS NOT NULL AND dataRetentionDays > 0`, resolves their schema name, opens a connection, executes deletion in batches, and records execution metrics in the system audit trail.

### the agent's Discretion
- The exact wording and translation strings for retention configuration UI inside messages localization files.
- The precise batching size when running queries in the cron job.
- Design layout of the UI form inputs and notifications toast feedback.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Schema
- `src/lib/db/schema.ts` — Definition of organizations and audit logs tables.
- `src/lib/db/tenant-db.ts` — Tenant database context connection helper.

### Existing Settings Page
- `src/app/(main)/[locale]/(app)/org/[orgSlug]/settings/security/page.tsx` — Target page for adding UI configuration card.
- `src/app/actions/security.ts` — Security server actions for reference.

### Cron Patterns
- `src/app/api/cron/billing-sync/route.ts` — Standard QStash cron authentication and execution pattern.

</canonical_refs>

<deferred>
## Deferred Ideas

- **SEC-03**: Fine-grained data masking settings per role for specific database schemas.
- Non-audit logs (e.g. telemetry usage buffers, system error traces) retention configs.

</deferred>

---

*Phase: 43-pol-ticas-de-reten-o-de-dados-autom-ticas-gdpr-lgpd*
*Context gathered: 2026-05-30*
