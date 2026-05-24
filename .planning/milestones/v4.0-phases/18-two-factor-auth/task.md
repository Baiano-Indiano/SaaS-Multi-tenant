# Task: Phase 18 - Two-Factor Authentication (2FA)

## Wave 1: Backend — Better-Auth 2FA Plugin Setup
- [x] Plan 1.1: Install and configure `twoFactor` plugin in `src/lib/auth/index.ts`
- [x] Plan 1.2: Update client with `twoFactorClient` plugin in `src/lib/auth/client.ts`
- [x] Plan 1.3: Run database migration (`npx @better-auth/cli migrate`)
- [x] Plan 1.4: Add `require2FA` column to `organizations` table in `src/lib/db/schema.ts` + Drizzle migration
- [x] Plan 1.5: Add `security:manage` permission in `src/lib/auth/permissions.ts`

## Wave 2: Backend — Server Actions for 2FA Management
- [x] Plan 2.1: Create 2FA enforcement Server Actions in `src/app/actions/security.ts`

## Wave 3: Frontend — Account-Level 2FA Settings
- [x] Plan 3.1: Create 2FA setup page in `src/app/(app)/account/security/page.tsx`
- [x] Plan 3.2: Create account settings layout in `src/app/(app)/account/layout.tsx`
- [x] Plan 3.3: Add account settings link to sidebar in `src/components/app-sidebar.tsx`
- [x] Create UI Components: `TwoFactorSetup`, `BackupCodesDisplay`, `TwoFactorStatus`

## Wave 4: Frontend — 2FA Verification on Login
- [x] Plan 4.1: Create 2FA verification page in `src/app/(auth)/verify-2fa/page.tsx`

## Wave 5: Org-Level 2FA Enforcement
- [x] Plan 5.1: Create Dedicated Security Settings Page (`src/app/(app)/org/[orgSlug]/settings/security/page.tsx`)
- [x] Plan 5.2: Create 2FA Enforcement Interstitial (`src/app/(app)/org/[orgSlug]/setup-2fa/page.tsx`)
- [x] Plan 5.3: Add enforcement check in org layout (`src/app/(app)/org/[orgSlug]/layout.tsx`)

## Wave 6: Settings Navigation Update
- [x] Plan 6.1: Add "Security" tab to org settings nav (`src/app/(app)/org/[orgSlug]/settings/layout.tsx`)

## Final Verification
- [x] Run `checklist.py`
- [x] Manual UAT walkthrough
