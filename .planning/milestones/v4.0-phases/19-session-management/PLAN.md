# Phase 19: Session Management

**Goal:** Give users and admins full visibility and control over active sessions.
**Requirements:** SEC-06, SEC-07, SEC-08, SEC-09
**Depends on:** Phase 18 (2FA)

## Context
Better-Auth's `multiSession` plugin allows tracking multiple active sessions for a single user. This phase exposes that data to the UI and provides revocation controls.

## Success Criteria
1. User can view list with device info, IP, and time.
2. User can revoke specific sessions.
3. User can revoke all other sessions.
4. Org admin can manage member sessions.

## Proposed Changes

### [Backend]
- `src/app/actions/security.ts`: Add actions for listing and revoking member sessions. (Done)
- `src/lib/auth/index.ts`: Add `multiSession` plugin. (Done)

### [Frontend]
- `src/components/security/sessions-list.tsx`: User-facing session list. (Done)
- `src/components/members/MemberSessionsDialog.tsx`: Admin-facing session manager. (Done)
- `src/app/(app)/account/security/page.tsx`: Integrate session list. (Done)
- `src/components/members/MemberActions.tsx`: Add session manager to member row. (Done)

## Verification
- [x] List active sessions on account security page.
- [x] Revoke a specific session from another device.
- [x] Revoke all other sessions.
- [x] Admin views member sessions in organization settings.
