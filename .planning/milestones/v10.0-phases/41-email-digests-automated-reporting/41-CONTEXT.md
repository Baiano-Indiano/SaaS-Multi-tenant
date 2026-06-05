# Phase 41: Email Digests & Automated Reporting - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers weekly activity email digests and on-demand/scheduled PDF/JSON reports for tenant organizations. It sets up a serverless cron job for compilation and leverages Resend for email deliveries, ensuring all generation tasks execute asynchronously without blocking main thread pools.

</domain>

<decisions>
## Implementation Decisions

### Serverless Cron Activity Digests
- **D-01:** Create a weekly cron endpoint at `/api/cron/email-digest/route.ts` triggered securely via QStash header signatures.
- **D-02:** The digest gathers organization metrics (projects created, member changes, security settings updates) across the previous 7 days and delivers the formatted digest to all organization owners/admins via Resend.

### Asynchronous Server-Side PDF & JSON Reports
- **D-03:** Install `jspdf` to compile structured audit and activity PDF buffers on the server.
- **D-04:** Expose `/api/org/[orgSlug]/reports` API endpoint to handle report generation requests. The endpoint generates and returns:
  - Structured PDF buffer (`application/pdf`)
  - Full metrics JSON payload (`application/json`)
- **D-05:** Report compilation runs asynchronously inside Server Action threads or Next.js Route handlers to prevent thread-blocking bottlenecks.

### UI Settings & Exports panel
- **D-06:** Integrate an exports drawer or card section on `/org/[orgSlug]/settings/activity` settings page to trigger on-demand downloads of PDF audit reports and activity logs.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/PROJECT.md` — Tenant separation schema boundary
- `.planning/REQUIREMENTS.md` — Requirements REP-01 and REP-02
- `.planning/ROADMAP.md` — Phase 41 objectives and success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/mail.ts` — Existing Resend instance and helper functions.
- `/api/cron/*` — Standard QStash cron authentication and header signatures middleware patterns.

</code_context>

<specifics>
## Specific Ideas

- Install `jspdf` as a lightweight Node/Edge friendly PDF compiler.
- Format the weekly digest emails with a premium dark layout matching the brand.

</specifics>

---
*Phase: 41-email-digests-automated-reporting*
*Context gathered: 2026-05-26*
