# Phase 18: Two-Factor Authentication (2FA)

**Goal:** Enable TOTP-based 2FA for user accounts with organizational enforcement.
**Requirements:** SEC-01, SEC-02, SEC-03, SEC-04, SEC-05
**Depends on:** Phase 01 (Auth Foundation — Better-Auth + Drizzle already running)

---

## Context

### Current State
- **Auth:** Better-Auth v1.6.5 with `organization()` plugin, Drizzle adapter, email/password auth
- **Auth config:** `src/lib/auth/index.ts` — single plugin (`organization`)
- **Auth client:** `src/lib/auth/client.ts` — `organizationClient()` only
- **Auth catch-all:** `src/app/api/auth/[...all]/route.ts`
- **DB schema:** `src/lib/db/schema.ts` — tables for user, session, account, verification, organization, member, invitation
- **User table:** has `id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`
- **Session table:** has `id`, `expiresAt`, `token`, `createdAt`, `updatedAt`, `ipAddress`, `userAgent`, `userId`
- **Settings layout:** `src/app/(app)/org/[orgSlug]/settings/layout.tsx` — has General, Members, Activity, Connectivity tabs
- **No middleware file exists** — auth checks happen in layouts/pages
- **No existing 2FA code** — clean slate
- **RBAC:** Permission-based system with `PERMISSIONS` map in `src/lib/auth/permissions.ts`

### What Better-Auth twoFactor Plugin Provides
- Server: `twoFactor()` plugin adds `enableTwoFactor()`, `verifyTOTP()`, `disableTwoFactor()` endpoints
- Client: `twoFactorClient()` adds `twoFactor.enable()`, `twoFactor.verifyTotp()`, `twoFactor.disable()` methods
- DB: Adds `twoFactorSecret`, `twoFactorBackupCodes`, `twoFactorEnabled` columns to user table
- Login flow: When 2FA-enabled user logs in, returns `twoFactorRedirect: true` — handled by `onTwoFactorRedirect` callback

---

## Execution Plan

### Wave 1: Backend — Better-Auth 2FA Plugin Setup

#### Plan 1.1: Install and configure twoFactor plugin

**File:** `src/lib/auth/index.ts`
**Action:** MODIFY

Add `twoFactor` import and plugin to the auth config:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, twoFactor } from "better-auth/plugins";
import { db } from "../db";
import * as schema from "../db/schema";

export const auth = betterAuth({
  appName: "Gravity SaaS",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      organization: schema.organizations,
      member: schema.members,
      invitation: schema.invitations,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization(),
    twoFactor({
      issuer: "Gravity SaaS",
      // backupCodeCount: 10 (default)
      // digits: 6 (default)
      // period: 30 (default)
    }),
  ],
});
```

**Verification:** Auth server initializes without errors.

---

#### Plan 1.2: Update client with twoFactorClient plugin

**File:** `src/lib/auth/client.ts`
**Action:** MODIFY

Add `twoFactorClient` import and plugin:

```typescript
import { createAuthClient } from "better-auth/react";
import { organizationClient, twoFactorClient } from "better-auth/client/plugins";
// ... existing imports

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    organizationClient(),
    twoFactorClient({
      onTwoFactorRedirect: () => {
        window.location.href = "/verify-2fa";
      },
    }),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
  useListOrganizations,
  useActiveOrganization,
  twoFactor, // <-- export 2FA methods
} = authClient;
```

**Verification:** Client exports `twoFactor` object with `enable`, `verifyTotp`, `disable` methods.

---

#### Plan 1.3: Run database migration

**Action:** COMMAND

```bash
npx @better-auth/cli migrate
```

This will add `twoFactorSecret`, `twoFactorBackupCodes`, and `twoFactorEnabled` columns to the `user` table.

**Verification:** Check DB for new columns on user table. Run `npx @better-auth/cli generate` to verify schema is in sync.

---

#### Plan 1.4: Add org-level 2FA enforcement to schema

**File:** `src/lib/db/schema.ts`
**Action:** MODIFY

Add `require2FA` column to `organizations` table:

```typescript
export const organizations = pgTable("organization", {
  // ... existing columns
  require2FA: boolean("require2FA").notNull().default(false),
});
```

Then run Drizzle migration:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

**Verification:** `organization` table has `require2FA` boolean column.

---

#### Plan 1.5: Add 2FA enforcement permission

**File:** `src/lib/auth/permissions.ts`
**Action:** MODIFY

Add new permission key:

```typescript
// Security Management
"security:manage": {
  key: "security:manage",
  name: "Manage Security",
  description: "Ability to enforce 2FA and manage security policies for the organization",
},
```

Add to `DEFAULT_ADMIN_PERMISSIONS` (already uses `ALL_PERMISSION_KEYS` so it will auto-include).

**Verification:** Permission available in role assignment UI.

---

### Wave 2: Backend — Server Actions for 2FA Management

#### Plan 2.1: Create 2FA enforcement Server Action

**File:** `src/app/actions/security.ts`
**Action:** NEW

```typescript
"use server";

// toggle2FAEnforcement(orgId, enabled) — updates organization.require2FA
// Requires 'security:manage' permission
// Logs to audit trail

// check2FACompliance(userId, orgId) — returns whether user needs to setup 2FA
// Used by layout/middleware to show interstitial
```

**Verification:** Action correctly toggles `require2FA` on the organization record.

---

### Wave 3: Frontend — Account-Level 2FA Settings

#### Plan 3.1: Create 2FA setup page (account settings)

**File:** `src/app/(app)/account/security/page.tsx`
**Action:** NEW

A new account-level settings page (not org-level) where the user can:
1. Enable 2FA → calls `twoFactor.enable({ password })` → shows QR code from `totpURI`
2. View backup codes (shown once on enable, with "copy all" button)
3. Verify TOTP → calls `twoFactor.verifyTotp({ code })` to confirm setup
4. Disable 2FA → calls `twoFactor.disable({ password })`

> **Note:** This is an **account-level** setting, NOT org-level. 2FA protects the entire user account across all organizations.

**UI Components needed:**
- `TwoFactorSetup` — Step wizard: Password → QR Code → Verify → Done
- `BackupCodesDisplay` — Grid of codes with copy/download
- `TwoFactorStatus` — Badge showing enabled/disabled

**Verification:** Full enable/disable flow works end-to-end.

---

#### Plan 3.2: Create account settings layout

**File:** `src/app/(app)/account/layout.tsx`
**Action:** NEW (if not exists)

Account-level settings layout with nav:
- Profile (future)
- Security (2FA) ← this phase

> This is separate from org settings (`/org/[slug]/settings`). Account settings live at `/account/security`.

---

#### Plan 3.3: Add account settings link to sidebar

**File:** `src/components/app-sidebar.tsx`
**Action:** MODIFY

Add a link to `/account/security` in the user menu section (bottom of sidebar). Label: "Security".

**Verification:** Clicking "Security" in sidebar navigates to account security page.

---

### Wave 4: Frontend — 2FA Verification on Login

#### Plan 4.1: Create 2FA verification page

**File:** `src/app/(auth)/verify-2fa/page.tsx`
**Action:** NEW

When a 2FA-enabled user logs in, Better-Auth returns a redirect signal. The `onTwoFactorRedirect` callback sends user to `/verify-2fa`.

This page:
1. Shows a 6-digit TOTP input
2. Has a "Use backup code" link that switches to a text input for backup codes
3. Calls `twoFactor.verifyTotp({ code })` on submit
4. On success, redirects to `/selecionar-org` (existing org selection page)
5. On failure, shows error and lets user retry

**Verification:** Login flow for 2FA-enabled user goes: Email/Password → Redirect to /verify-2fa → Enter TOTP → Access granted.

---

### Wave 5: Org-Level 2FA Enforcement

#### Plan 5.1: Create 2FA enforcement toggle in org settings

**File:** `src/app/(app)/org/[orgSlug]/settings/general/page.tsx`
**Action:** MODIFY

Add a "Security" section with:
- Toggle switch: "Require 2FA for all members"
- Only visible to users with `security:manage` permission
- Calls `toggle2FAEnforcement` server action
- Shows confirmation dialog: "Members without 2FA will be prompted to set it up on next login"

**Verification:** Admin can toggle enforcement. Non-admins don't see the toggle.

---

#### Plan 5.2: Create 2FA enforcement interstitial

**File:** `src/app/(app)/org/[orgSlug]/setup-2fa/page.tsx`
**Action:** NEW

When a user accesses an org with `require2FA=true` and their `twoFactorEnabled=false`:
1. Show a full-page interstitial: "This organization requires two-factor authentication"
2. Embed the same `TwoFactorSetup` component from Wave 3
3. On successful setup, redirect to the original destination

**Verification:** Member without 2FA accessing an enforced org sees interstitial and can't proceed without setting up 2FA.

---

#### Plan 5.3: Add enforcement check in org layout

**File:** `src/app/(app)/org/[orgSlug]/layout.tsx`
**Action:** MODIFY

Add a check after auth verification:
1. Fetch org settings (specifically `require2FA`)
2. If `require2FA=true` AND user's `twoFactorEnabled=false`
3. Redirect to `/org/[orgSlug]/setup-2fa`

```typescript
// In the layout, after existing auth checks:
const org = await getOrganization(orgSlug);
const user = await getCurrentUser();

if (org.require2FA && !user.twoFactorEnabled) {
  redirect(`/org/${orgSlug}/setup-2fa`);
}
```

**Verification:** Enforcement redirect works. Users with 2FA enabled pass through normally.

---

### Wave 6: Settings Navigation Update

#### Plan 6.1: Add "Security" tab to org settings nav

**File:** `src/app/(app)/org/[orgSlug]/settings/layout.tsx`
**Action:** MODIFY

Add a "Security" nav item:
```typescript
{
  title: "Security",
  href: `/org/${orgSlug}/settings/general`, // same page, but section anchor
}
```

> **Decision:** Keep security toggle in General settings page (not a separate route) to avoid fragmenting simple settings. If security settings grow in future phases, extract to dedicated route.

---

## File Change Summary

| File | Action | Wave |
|------|--------|------|
| `src/lib/auth/index.ts` | MODIFY | 1 |
| `src/lib/auth/client.ts` | MODIFY | 1 |
| `src/lib/db/schema.ts` | MODIFY | 1 |
| `src/lib/auth/permissions.ts` | MODIFY | 1 |
| `src/app/actions/security.ts` | NEW | 2 |
| `src/app/(app)/account/security/page.tsx` | NEW | 3 |
| `src/app/(app)/account/layout.tsx` | NEW | 3 |
| `src/components/two-factor/two-factor-setup.tsx` | NEW | 3 |
| `src/components/two-factor/backup-codes-display.tsx` | NEW | 3 |
| `src/components/two-factor/two-factor-status.tsx` | NEW | 3 |
| `src/components/app-sidebar.tsx` | MODIFY | 3 |
| `src/app/(auth)/verify-2fa/page.tsx` | NEW | 4 |
| `src/app/(app)/org/[orgSlug]/settings/general/page.tsx` | MODIFY | 5 |
| `src/app/(app)/org/[orgSlug]/setup-2fa/page.tsx` | NEW | 5 |
| `src/app/(app)/org/[orgSlug]/layout.tsx` | MODIFY | 5 |
| `src/app/(app)/org/[orgSlug]/settings/layout.tsx` | MODIFY | 6 |

**Total:** 7 new files, 9 modified files

---

## UAT Verification Criteria

- [ ] **UAT-1:** User enables 2FA from `/account/security`, scans QR code, enters TOTP, sees "2FA Enabled" badge
- [ ] **UAT-2:** Backup codes are displayed exactly once after enabling 2FA, with copy/download option
- [ ] **UAT-3:** User disables 2FA after entering password + current TOTP
- [ ] **UAT-4:** Login with 2FA-enabled account redirects to `/verify-2fa`, entering correct TOTP grants access
- [ ] **UAT-5:** Login with incorrect TOTP shows error, user can retry
- [ ] **UAT-6:** Backup code works as alternative to TOTP on `/verify-2fa` page
- [ ] **UAT-7:** Org admin toggles "Require 2FA" from org settings (requires `security:manage` permission)
- [ ] **UAT-8:** Non-admin member does NOT see the 2FA enforcement toggle
- [ ] **UAT-9:** Member without 2FA accessing an enforced org sees setup interstitial
- [ ] **UAT-10:** After completing 2FA setup on interstitial, member can access the org normally
- [ ] **UAT-11:** Audit log records 2FA enable/disable events

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Better-Auth migration breaks existing columns | HIGH | Run `npx @better-auth/cli generate` first to preview changes |
| User loses authenticator app access | HIGH | Backup codes are mandatory on enable. Display prominently. |
| Clock drift causes TOTP rejection | LOW | Better-Auth default ±1 window handles ≤30s drift |
| Enforcement locks out users who forgot to setup | MEDIUM | Interstitial page guides setup, doesn't lock out from other orgs |

---

## Dependencies

- `better-auth ^1.6.5` (already installed — twoFactor plugin is built-in)
- `qrcode` or `qrcode.react` — for rendering TOTP URI as QR code (NEW dependency)

---
*Phase 18 Plan — Created 2026-04-24*
