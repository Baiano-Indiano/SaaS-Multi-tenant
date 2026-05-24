# Research: Phase 04 — Dynamic RBAC

## Current State Analysis

- **Auth Foundation**: Better-Auth is configured on the backend (`lib/auth/index.ts`) and API routes exist (`api/auth/[...all]`). However, **all UI pages for Auth are missing** (Login, Register).
- **Multi-Tenancy**: The `middleware.ts` is active and redirects to `/login`. The `organizations` table exists in the `public` schema.
- **RBAC Logic**: 
    - Permission keys are defined in `src/lib/auth/permissions.ts`.
    - `rbac-utils.ts` contains the `can` check using raw SQL for tenant schemas.
    - Server Actions for RBAC are partially implemented in `src/app/actions/rbac.ts`.
- **UI Components**:
    - `RoleDialog.tsx` exists (draft).
    - `RoleListing` exists (draft).

## Identified Gaps (Critical)

1. **Authentication UI**: Users cannot log in, making it impossible to test RBAC context.
2. **Organization Selection**: There is no way for a user to select an organization or create one via UI.
3. **Session Context**: The `permissions` are injected into the session metadata in `onSessionCreate`, but we need to verify this works correctly with the `usePermission` hook on the client.

## Proposed Tech Approach

- **Frontend**: Use `Better-Auth` client hooks for auth and org management.
- **RBAC**: Persist roles and role-permissions mapping in the **tenant-specific schema**. This ensures total isolation.
- **Server Actions**: All RBAC mutations must be protected by the `can("roles:manage")` check.

## Dependencies

- **Phase 1-3 Recovery**: We must implement Login/Register/OrgSelection before we can finalize and test RBAC.
