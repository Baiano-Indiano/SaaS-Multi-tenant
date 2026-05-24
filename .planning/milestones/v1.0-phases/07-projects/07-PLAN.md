# Plan: Phase 07 - Project Management

## Objectives
Implement a robust, tenant-isolated project management module.

## Proposed Changes
- Define `projects` table in the database schema.
- Implement server actions in `src/app/actions/projects.ts`:
    - `createProjectAction`: Uses `getTenantDb` to target the active organization's schema.
    - `getProjectsAction`: Retrieves strictly isolated projects for the tenant.
    - `deleteProjectAction`: Secure deletion within tenant boundaries.
- Build the `/projects` page with responsive data tables and side-dialogs for creation.

## Verification
- Verified that cross-tenant access attempts fail due to `search_path` and `orgId` verification in `getTenantDb`.
- Verified UI consistency across empty and populated project states.
