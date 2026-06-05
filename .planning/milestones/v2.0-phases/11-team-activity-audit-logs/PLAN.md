# Retroactive Plan: Team Activity & Audit Logs (Phase 11)

Implementation of a robust audit logging system to track team activity across the multi-tenant SaaS.

## Proposed Changes

### Backend & Database
- **[MODIFY] [tenant.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/lib/db/tenant.ts)**: Ensure `audit_log` table is correctly initialized in tenant schemas.
- **[MODIFY] [member.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/actions/member.ts)**, **[rbac.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/actions/rbac.ts)**: Added `recordAuditLog` calls to track invitations, role changes, and member deletions.
- **[NEW] [cleanup-logs/route.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/api/cron/cleanup-logs/route.ts)**: Vercel Cron handler for automatic log rotation.
- **[DELETE] [cleanup-audit-logs/route.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/api/cron/cleanup-audit-logs/route.ts)**: Removed legacy cron route.

### Frontend
- **[MODIFY] [ActivityLog.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/settings/ActivityLog.tsx)**: Implemented daily grouping, timeline visuals, and metadata inspection modal.
- **[MODIFY] [Activity Page](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/(app)/org/%5BorgSlug%5D/settings/activity/page.tsx)** (if existing): Refined layout.

## Verification
- Perform actions (invite member, change role) and verify logs appear in the feed.
- Check metadata modal for accurate technical details.
- Verify log grouping ("Today", "Yesterday").
