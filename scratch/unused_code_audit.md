# Codebase Audit: Unused Files, Components, Exports, and Functions

This audit documents unused files, components, exports, and functions across the project, focusing on the `src/` directory, component imports, helper imports, settings pages, and dependencies.

---

## 📁 1. Unused Files (39 files total)

These files exist in the repository but have no imports or active references in the main codebase.

### Core Application & UI
*   `src/app/actions/analytics.ts` — Unused analytics server action file.
*   `src/app/actions/audit.ts` — Unused audit server action file.
*   `src/components/create-org-trigger.tsx` — Trigger component for organization creation.
*   `src/components/marketing/hero-graphic.tsx` — Marketing hero illustration/animation.
*   `src/components/members/InvitationsTable.tsx` — Table component for team invitations.
*   `src/components/org/SecuritySettingsForm.tsx` — Form for organization security settings.
*   `src/components/rbac/PermissionBoundary.tsx` — RBAC permission wrapper.

### UI Kit & Hooks (`src/components/ui`, `src/hooks`)
*   `src/components/ui/glass-glow.tsx` — Glassmorphic decorative component.
*   `src/components/ui/progress.tsx` — shadcn UI Progress component.
*   `src/components/ui/toast.tsx` — shadcn UI Toast primitive component.
*   `src/components/ui/toaster.tsx` — shadcn UI Toaster container component.
*   `src/hooks/use-toast.ts` — Toast interaction hook.

### Libraries & Helpers (`src/lib`)
*   `src/lib/api/guides/index.ts` — API guides helpers.
*   `src/lib/api/openapi.ts` — OpenAPI setup.
*   `src/lib/db/check-stats.ts` — Database stats checker.

### Utility Scripts & Database Tasks (`src/scripts`, root)
*   `check-all-tenant-projects.ts`
*   `check-members.ts`
*   `check-orgs.ts`
*   `check-public-projects.ts`
*   `debug-stats.ts`
*   `src/scripts/compare-translations.ts`
*   `src/scripts/debug-db.ts`
*   `src/scripts/fix-tenant-schemas.ts`
*   `src/scripts/migrate-rbac.ts`
*   `src/scripts/reset-2fa.ts`

### Scratch Workspace Scripts (`scratch/`)
*   `scratch/check_schema.ts`
*   `scratch/check-sessions.ts`
*   `scratch/debug-db.ts`
*   `scratch/debug-sessions.ts`
*   `scratch/gen-backup-code.ts`
*   `scratch/test-crypto.ts`
*   `scratch/test-get-session.ts`
*   `scratch/test-hash.ts`
*   `scratch/test-list-orgs-auth.ts`
*   `scratch/test-list-orgs.ts`
*   `scratch/verify_siem_export.ts`
*   `scratch/verify-decrypt.ts`

### Tests
*   `tests/auth.spec.ts`
*   `tests/rbac.spec.ts`

---

## 📦 2. Dependency Audit

### Unused Dependencies (Declaring in `package.json` but not imported)
These packages are listed in `package.json` but are not utilized in the code:
*   `@radix-ui/react-progress`
*   `@radix-ui/react-toast`
*   `@testing-library/react` (DevDependency)
*   `@types/uuid` (DevDependency)

### Unlisted/Implicit Dependencies (Used in code but missing from `package.json`)
These packages are referenced but not formally declared as project dependencies:
*   `dotenv` — Extensively used in config files:
    *   `drizzle.config.ts:2:25`
    *   `playwright.config.ts:2:20`
    *   `src/cli/index.ts:1:20`
    *   `src/db/seed-test.ts:1:20`
    *   `src/scripts/migrate-tenants.ts:1:20`
    *   `src/scripts/sync-permissions.ts:2:20`
*   `react-motion` — Imported in `src/components/dashboard/InfraHealthMonitor.tsx:3:24`

---

## 🔗 3. Unused Exports & Functions

These functions, variables, schemas, or components are exported from files but never imported/used elsewhere in the codebase.

### Actions (`src/app/actions/`)
*   `cancelInvitationAction` (`src/app/actions/member.ts:263`)
*   `getPendingInvitationsAction` (`src/app/actions/member.ts:296`)
*   `syncRolePermissionsAction` (`src/app/actions/rbac.ts:182`)
*   `check2FAComplianceAction` (`src/app/actions/security.ts:71`)

### Custom Components
*   `RoleSelector` (`src/components/members/MemberActions.tsx:46`)
*   `RemoveMemberButton` (`src/components/members/MemberActions.tsx:153`)

### UI Primitives / System Components (`src/components/ui/`)
*   `AlertDialogMedia`, `AlertDialogOverlay`, `AlertDialogPortal` (`alert-dialog.tsx`)
*   `badgeVariants` (`badge.tsx`)
*   `buttonVariants` (`button.tsx`)
*   `CardAction` (`card.tsx`)
*   `DialogClose`, `DialogOverlay`, `DialogPortal` (`dialog.tsx`)
*   `DropdownMenuPortal`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent` (`dropdown-menu.tsx`)
*   `PopoverDescription`, `PopoverHeader`, `PopoverTitle` (`popover.tsx`)
*   `ScrollBar` (`scroll-area.tsx`)
*   `SelectScrollDownButton`, `SelectScrollUpButton` (`select.tsx`)
*   `SheetTrigger`, `SheetClose`, `SheetFooter` (`sheet.tsx`)
*   `SidebarGroupAction`, `SidebarInput`, `SidebarInset`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubButton`, `SidebarMenuSubItem`, `SidebarRail`, `SidebarSeparator`, `useSidebar` (`sidebar.tsx`)
*   `TableFooter`, `TableCaption` (`table.tsx`)

### Helpers & Utilities (`src/lib/`)
*   `getPathname` (`src/i18n/routing.ts:17`)
*   `registry` (`src/lib/api/openapi-generator.ts:10`)
*   `planQuotas` (`src/lib/api/stats.ts:5`)
*   `sanitizeAuditDetails` (`src/lib/audit.ts:15`)
*   `validateApiKey` (`src/lib/auth/api-key.ts:33`)
*   `signIn`, `signUp`, `signOut`, `organization`, `useActiveOrganization`, `twoFactor`, `multiSession`, `sso`, `usePermission` (`src/lib/auth/client.ts`)
*   `PERMISSIONS_METADATA_KEY` (`src/lib/auth/rbac-utils.ts:98`)
*   `tierLimiters` (`src/lib/rate-limit.ts:9`)
*   `API_KEY_REDIS_PREFIX` (`src/lib/redis.ts:17`)
*   `CSP_DOMAINS` (`src/lib/security.ts:30`)
*   `SENTRY_REPORT_URI` (`src/lib/security.ts:63`)
*   `getFingerprint` (`src/lib/security/anomaly-detection.ts:26`)
*   `formatForSIEM` (`src/lib/security/audit-exporter.ts:26`)
*   `getLogsForExport` (`src/lib/security/audit-exporter.ts:49`)
*   `verifyDomainOwnership` (`src/lib/vercel.ts:75`)

### Validation Schemas (`src/lib/validations/index.ts`)
The following Zod schemas are defined and exported but not used in the application:
*   `uuidSchema` (line 5)
*   `slugSchema` (line 7)
*   `orgNameSchema` (line 13)
*   `urlSchema` (line 21)
*   `nameSchema` (line 23)
*   `descriptionSchema` (line 29)
*   `cancelInvitationSchema` (line 70)
*   `acceptInvitationSchema` (line 76)
*   `filterRuleOperatorSchema` (line 152)
*   `filterRuleSchema` (line 161)
*   `filterGroupSchema` (line 178)
*   `listMemberSessionsSchema` (line 247)
*   `revokeMemberSessionsSchema` (line 252)
*   `revokeMemberSessionSchema` (line 258)

### Unused Types & Interfaces
*   `FilterOperator` (`src/components/settings/workflows/workflow-builder.tsx:61`)
*   `FilterRule` (`src/components/settings/workflows/workflow-builder.tsx:63`)
*   `Permission` (`src/lib/auth/permissions.ts:97`)
*   `FilterOperator` (`src/lib/workflows/evaluator.ts:1`)
*   `FilterRule` (`src/lib/workflows/evaluator.ts:3`)

---

## 🔀 4. Duplicate Exports
*   `ALL_PERMISSION_KEYS` and `DEFAULT_ADMIN_PERMISSIONS` are duplicated/re-exported in `src/lib/auth/permissions.ts`.
