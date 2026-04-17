# Plan: Phase 04 — Dynamic RBAC

## Goal
Implement a fully dynamic RBAC system where organization admins can create roles and assign specific permissions. This data must be stored in the tenant-isolated schema.

## Milestones

### 1. Foundation Recovery (Phase 4.0)
- [ ] Create `(auth)` route group and implement `Login` and `Register` pages.
- [ ] Implement `selecionar-org` page for organization choice/creation.
- [ ] Update `middleware.ts` to coordinate session and org selection.
- [ ] Link Landing Page "Get Started" buttons to `/register`.

### 2. RBAC Backend & Logic
- [ ] Solidify `src/app/actions/rbac.ts` for safe schema-aware mutations.
- [ ] Ensure `usePermission` hook correctly reads session metadata.
- [ ] Implement a `withPermission` higher-order component or wrapper for UI protection.

### 3. RBAC UI Finalization
- [ ] Finalize `RoleDialog.tsx` for Role Create/Edit with full form validation.
- [ ] Implement a delete confirmation for roles.
- [ ] Ensure the "System" roles (Admin, Member) are protected or handled correctly.

### 4. Verification & Audit
- [ ] End-to-end test: Login -> Create Org -> Create Role -> Assign to User -> Verify Access.
- [ ] Security audit: Attempt to call RBAC actions without proper permissions.

## Proposed Changes

### New Files
- `src/app/(auth)/login/page.tsx`: Login UI.
- `src/app/(auth)/register/page.tsx`: Registration UI.
- `src/app/(app)/selecionar-org/page.tsx`: Org management/selection.
- `src/components/auth/AuthForm.tsx`: Shared auth logic.

### Modified Files
- `src/app/(marketing)/page.tsx`: Landing page links.
- `src/app/actions/rbac.ts`: Ensure robustness.
- `src/components/rbac/RoleDialog.tsx`: UI polish and connection.

## Verification Plan

### Automated
- `npx drizzle-kit push` to ensure schemas are synced.
- `src/scripts/test-db.ts` for connectivity.

### Manual (UAT)
1. Register new user.
2. Create Organization "Test Corp".
3. Navigate to Roles page.
4. Create role "Custom Editor" with `projects:create` permission.
5. Verify UI reflects the new role and permissions.
