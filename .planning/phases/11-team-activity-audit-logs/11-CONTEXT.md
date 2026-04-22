# Phase 11 Context: Team Activity & Audit Logs

## Core Decisions

1. **Capture Strategy: Manual (Server Actions)**
   - **Decision**: Explicit calls to `recordAuditLog` inside each Server Action.
   - **Rationale**: Explicit logic is easier to debug and maintain than "magic" wrappers or database triggers. It allows for fine-grained control over the log message.

2. **Detail Level (Payload): Summary String**
   - **Decision**: A clear, human-readable summary of the action (e.g., "John changed project name from X to Y").
   - **Rationale**: Avoids database bloat from storing full state diffs while providing sufficient context for administrators.

3. **UI Style: Activity Feed (Vercel/GitHub Style)**
   - **Decision**: Modern vertical feed with grouping by day, contextual icons, and relative timestamps.
   - **Rationale**: Elevates the UX for enterprise tenants compared to standard tables.

4. **Automatic Cleanup: Vercel Cron**
   - **Decision**: Background cleanup of logs older than 90 days via a scheduled endpoint.
   - **Rationale**: Prevents performance degradation over time without impacting the main application's responsiveness.

## Technical Baseline

- **Database**: `audit_log` table exists in the tenant-isolated schema.
- **Utility**: `src/lib/audit.ts` provides `recordAuditLog` and `cleanupAuditLogs`.
- **UI**: `src/app/(app)/org/[orgSlug]/settings/activity/page.tsx` and `src/components/settings/ActivityLog.tsx` are already implemented but require refinement (grouping by day, etc.).
- **Server Actions**: Currently existing actions in `src/app/actions/` need to be instrumented.
