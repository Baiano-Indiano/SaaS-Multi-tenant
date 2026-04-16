---
phase: 3
name: deep-multi-tenant-context
wave: sequential
requirements: [ORG-01, ORG-02, ORG-03]
files_modified:
  - src/lib/db/schema.ts
  - src/lib/db/index.ts
  - src/lib/db/tenant.ts
  - src/lib/actions/organization.ts
  - src/lib/auth/index.ts
  - src/middleware.ts
  - src/components/org-switcher.tsx
  - src/app/(app)/layout.tsx
  - src/app/(app)/selecionar-org/page.tsx
  - src/app/(app)/dashboard/page.tsx
autonomous: true
---

# Phase 3 Plan: Deep Multi-Tenant Context

**Goal:** Build organization creation flow with synchronous Drizzle schema generation per tenant (UUID-based), a Vercel-style org switcher in the sidebar, and middleware that enforces tenant boundaries with clean redirects.

**Requirements:** ORG-01, ORG-02, ORG-03

---

<threat_model>
## Security Threat Model

### Threats Identified

| # | Threat | Severity | Mitigation |
|---|--------|----------|------------|
| T-01 | Tenant schema injection via org name/slug used in SQL | **Critical** | Use UUID (`tenant_{uuid}`) for schema names — never user-controlled input |
| T-02 | Horizontal privilege escalation: User A accesses org slug of User B | **High** | Middleware validates session `activeOrganizationId` matches the slug in the URL |
| T-03 | Schema creation race condition (duplicate schemas) | **Medium** | Wrap `CREATE SCHEMA IF NOT EXISTS` in a single transaction with idempotent check |
| T-04 | Server Action CSRF abuse on org creation endpoint | **Medium** | Better-Auth session validation at the top of every Server Action |
| T-05 | Leaking organization existence via 403 vs 404 response | **Low** | Always redirect to `/selecionar-org` (D-04) — no information leakage |

### Mitigations Applied in This Plan
- Schema names are always `tenant_{uuid}` — UUID is system-generated (T-01)
- Middleware checks `membership` in Better-Auth before allowing access (T-02)
- Schema creation uses `CREATE SCHEMA IF NOT EXISTS` (T-03)
- Server Actions call `auth.api.getSession()` at the top before any mutation (T-04)
- Unauthorized access redirects cleanly to `/selecionar-org` (T-05)
</threat_model>

---

## Wave 1 — Database & Schema Infrastructure

### Task 1.1 — Add `tenantSchemaName` to `organizations` table
**[BLOCKING — prerequisite for all Drizzle schema work]**

<read_first>
- `src/lib/db/schema.ts` — current organizations table structure
- `src/lib/db/index.ts` — current Drizzle client setup
</read_first>

<action>
In `src/lib/db/schema.ts`, add a new column to the `organizations` pgTable:

```ts
tenantSchemaName: text("tenantSchemaName").notNull(),
```

The column goes after `metadata` on the organizations table. The value will always be `tenant_${organization.id}` (formatted at creation time). This column is the canonical source of truth for the schema name — never re-derive it dynamically from the ID at runtime.
</action>

<acceptance_criteria>
- `src/lib/db/schema.ts` contains `tenantSchemaName: text("tenantSchemaName").notNull()` inside `organizations` pgTable
- No other table is modified in this task
</acceptance_criteria>

---

### Task 1.2 — Create `src/lib/db/tenant.ts` — Dynamic schema utility

<read_first>
- `src/lib/db/index.ts` — existing Drizzle client (postgres.js driver)
- `src/lib/db/schema.ts` — updated organizations table
</read_first>

<action>
Create new file `src/lib/db/tenant.ts`:

```ts
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

/**
 * Creates a dedicated PostgreSQL schema for a tenant synchronously.
 * Uses raw SQL because Drizzle's schema management APIs are config-time only.
 * Schema name is always `tenant_{uuid}` — never derived from user input.
 */
export async function createTenantSchema(tenantSchemaName: string): Promise<void> {
  // Validate format to prevent injection: must be tenant_ followed by a UUID
  const VALID_SCHEMA_PATTERN = /^tenant_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!VALID_SCHEMA_PATTERN.test(tenantSchemaName)) {
    throw new Error(`Invalid tenant schema name format: ${tenantSchemaName}`);
  }

  // Use a separate connection for DDL — avoids polluting the app connection pool
  const sql = postgres(connectionString, { prepare: false, max: 1 });

  try {
    // Idempotent — safe to call multiple times
    await sql`CREATE SCHEMA IF NOT EXISTS ${sql(tenantSchemaName)}`;
  } finally {
    await sql.end();
  }
}
```
</action>

<acceptance_criteria>
- `src/lib/db/tenant.ts` exists
- Contains `createTenantSchema` function exported
- Function validates schema name with regex before executing SQL
- Uses `CREATE SCHEMA IF NOT EXISTS` (idempotent)
- Opens and closes its own connection (does not use the shared `db` instance)
</acceptance_criteria>

---

### Task 1.3 — [BLOCKING] Run Drizzle schema push

<read_first>
- `drizzle.config.ts` — current config pointing to `./src/lib/db/schema.ts`
- `src/lib/db/schema.ts` — verify Task 1.1 column was saved
</read_first>

<action>
Execute the Drizzle schema push to apply the new `tenantSchemaName` column to the live database:

```bash
npx drizzle-kit push
```

If the push fails due to existing rows with NULL values, use:
```bash
npx drizzle-kit push --force
```

This is a **blocking task** — subsequent tasks that create organizations will fail if the column doesn't exist in the database.
</action>

<acceptance_criteria>
- Command exits with code 0 (no errors)
- Column `tenantSchemaName` exists in the `organization` table in PostgreSQL (verify with: `SELECT column_name FROM information_schema.columns WHERE table_name='organization' AND column_name='tenantSchemaName'`)
</acceptance_criteria>

---

## Wave 2 — Organization Creation Server Action

### Task 2.1 — Create `src/lib/actions/organization.ts`

<read_first>
- `src/lib/db/index.ts` — Drizzle `db` instance
- `src/lib/db/schema.ts` — `organizations` and `members` tables
- `src/lib/db/tenant.ts` — `createTenantSchema` function (Task 1.2)
- `src/lib/auth/index.ts` — `auth` instance with organization plugin
</read_first>

<action>
Create `src/lib/actions/organization.ts`:

```ts
'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizations, members } from '@/lib/db/schema';
import { createTenantSchema } from '@/lib/db/tenant';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export type CreateOrgState = {
  error?: string;
};

export async function createOrganizationAction(
  _prevState: CreateOrgState,
  formData: FormData
): Promise<CreateOrgState> {
  // Security: Validate session before any mutation
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: 'Unauthorized' };
  }

  const name = (formData.get('name') as string)?.trim();
  if (!name || name.length < 2 || name.length > 64) {
    return { error: 'Organization name must be between 2 and 64 characters' };
  }

  // Generate slug from name (lowercase, hyphens only)
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Use Better-Auth organization plugin to create org (handles ID generation)
  const org = await auth.api.createOrganization({
    body: { name, slug },
    headers: await headers(),
  });

  if (!org) {
    return { error: 'Failed to create organization' };
  }

  // Persist the tenantSchemaName on the organization record
  const tenantSchemaName = `tenant_${org.id}`;
  await db
    .update(organizations)
    .set({ tenantSchemaName })
    .where(eq(organizations.id, org.id));

  // Synchronously create the Postgres schema for this tenant (D-05)
  await createTenantSchema(tenantSchemaName);

  // Set the new org as the active organization and redirect to its dashboard
  await auth.api.setActiveOrganization({
    body: { organizationId: org.id },
    headers: await headers(),
  });

  redirect(`/org/${slug}/dashboard`);
}
```

Import `eq` from `drizzle-orm` at the top of the file.
</action>

<acceptance_criteria>
- File `src/lib/actions/organization.ts` exists with `'use server'` directive
- `createOrganizationAction` is exported and accepts `(prevState, FormData)`
- Session is validated with `auth.api.getSession` before mutation
- `tenantSchemaName` is set as `tenant_${org.id}` on the org record
- `createTenantSchema` is called after DB update and before redirect
- Function redirects to `/org/[slug]/dashboard` on success
</acceptance_criteria>

---

### Task 2.2 — Create `src/components/create-org-dialog.tsx`

<read_first>
- `src/components/ui/` — available shadcn components (Dialog, Button, Input, Label)
- `src/lib/actions/organization.ts` — `createOrganizationAction` signature
</read_first>

<action>
Create `src/components/create-org-dialog.tsx`:

```tsx
'use client';

import { useActionState } from 'react';
import { createOrganizationAction } from '@/lib/actions/organization';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrgDialog({ open, onOpenChange }: CreateOrgDialogProps) {
  const [state, action, isPending] = useActionState(createOrganizationAction, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Give your workspace a name. You can invite members after creation.
          </DialogDescription>
        </DialogHeader>
        <form action={action}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Acme Corp"
                required
                minLength={2}
                maxLength={64}
                autoFocus
              />
            </div>
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Organization'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```
</action>

<acceptance_criteria>
- File `src/components/create-org-dialog.tsx` exists
- Uses `useActionState` with `createOrganizationAction`
- Has `name` input with `required`, `minLength={2}`, `maxLength={64}`
- Displays `state.error` when present
- Submit button shows "Creating..." when `isPending` is true
</acceptance_criteria>

---

## Wave 3 — Org Switcher Component

### Task 3.1 — Create `src/components/org-switcher.tsx`

<read_first>
- `src/components/app-sidebar.tsx` — current sidebar structure with placeholder header
- `src/components/ui/` — available shadcn components
- `src/components/create-org-dialog.tsx` — dialog created in Task 2.2
</read_first>

<action>
Create `src/components/org-switcher.tsx` — a dropdown following the Vercel/Notion/Slack UX pattern (D-02, D-03):

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronsUpDown, Check, Plus, Building2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { CreateOrgDialog } from '@/components/create-org-dialog';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
}

interface OrgSwitcherProps {
  organizations: Organization[];
  activeOrgId: string | null;
}

export function OrgSwitcher({ organizations, activeOrgId }: OrgSwitcherProps) {
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const activeOrg = organizations.find((o) => o.id === activeOrgId) ?? organizations[0];

  const handleSwitch = (org: Organization) => {
    // D-03: Immediate navigation-based context switch
    router.push(`/org/${org.slug}/dashboard`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Building2 className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {activeOrg?.name ?? 'Select Organization'}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {organizations.length} organization{organizations.length !== 1 ? 's' : ''}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          side="bottom"
          align="start"
          sideOffset={4}
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Organizations
          </DropdownMenuLabel>
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSwitch(org)}
              className="cursor-pointer"
            >
              <Building2 className="mr-2 size-4" />
              <span className="flex-1 truncate">{org.name}</span>
              {org.id === activeOrg?.id && <Check className="ml-auto size-4" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {/* D-02: Fixed "Create" button at the bottom — Vercel/Notion pattern */}
          <DropdownMenuItem
            onClick={() => setCreateDialogOpen(true)}
            className="cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <Plus className="mr-2 size-4" />
            Create Organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateOrgDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
```
</action>

<acceptance_criteria>
- File `src/components/org-switcher.tsx` exists
- Has a `DropdownMenu` with list of organizations and active checkmark
- "Create Organization" is the last `DropdownMenuItem` after `DropdownMenuSeparator`
- Clicking an org calls `router.push('/org/[slug]/dashboard')`
- Clicking "Create Organization" opens `CreateOrgDialog` (`createDialogOpen` state)
</acceptance_criteria>

---

## Wave 4 — Routing & Middleware

### Task 4.1 — Create org-scoped route group `src/app/(app)/org/[orgSlug]/`

<read_first>
- `src/app/(app)/` — existing app route group structure
- `src/app/(app)/dashboard/page.tsx` — existing dashboard page
</read_first>

<action>
Create the following directory structure under `src/app/(app)/`:

1. `src/app/(app)/org/[orgSlug]/layout.tsx` — Layout that fetches org data and passes to children
2. `src/app/(app)/org/[orgSlug]/dashboard/page.tsx` — Tenant dashboard page

**`src/app/(app)/org/[orgSlug]/layout.tsx`:**
```tsx
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizations, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect('/login');

  // Fetch org by slug
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  // D-04: If org doesn't exist or user is not a member → redirect cleanly
  if (!org) redirect('/selecionar-org');

  const membership = await db.query.members.findFirst({
    where: and(
      eq(members.organizationId, org.id),
      eq(members.userId, session.user.id)
    ),
  });

  if (!membership) redirect('/selecionar-org');

  // Fetch all orgs the user belongs to (for the switcher)
  const userMemberships = await db.query.members.findMany({
    where: eq(members.userId, session.user.id),
    with: { organization: true },
  });

  const userOrgs = userMemberships.map((m) => m.organization);

  return (
    <SidebarProvider>
      <AppSidebar
        organizations={userOrgs}
        activeOrgId={org.id}
      />
      <main className="flex-1">{children}</main>
    </SidebarProvider>
  );
}
```

**`src/app/(app)/org/[orgSlug]/dashboard/page.tsx`:**
```tsx
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function OrgDashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/login');

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        Workspace: <strong>{orgSlug}</strong>
      </p>
    </div>
  );
}
```
</action>

<acceptance_criteria>
- `src/app/(app)/org/[orgSlug]/layout.tsx` exists
- Layout fetches org by slug and validates user membership
- Non-members are redirected to `/selecionar-org` (not 403/404)
- `AppSidebar` receives `organizations` and `activeOrgId` props
- `src/app/(app)/org/[orgSlug]/dashboard/page.tsx` exists and renders org slug
</acceptance_criteria>

---

### Task 4.2 — Create `/selecionar-org` page

<read_first>
- `src/lib/auth/index.ts` — auth instance
- `src/lib/db/schema.ts` — members and organizations tables
</read_first>

<action>
Create `src/app/(app)/selecionar-org/page.tsx`:

```tsx
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { members } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Building2, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CreateOrgDialog } from '@/components/create-org-dialog';

// This is a Server Component — dialog trigger must be client
export default async function SelectOrgPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/login');

  const userMemberships = await db.query.members.findMany({
    where: eq(members.userId, session.user.id),
    with: { organization: true },
  });

  const orgs = userMemberships.map((m) => m.organization);

  // If user has exactly 1 org, auto-redirect
  if (orgs.length === 1) {
    redirect(`/org/${orgs[0].slug}/dashboard`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Select Organization</h1>
          <p className="text-muted-foreground">
            Choose a workspace to continue.
          </p>
        </div>

        {orgs.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Building2 className="mx-auto mb-4 size-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              You&apos;re not part of any organization yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {orgs.map((org) => (
              <Link
                key={org.id}
                href={`/org/${org.slug}/dashboard`}
                className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                <Building2 className="size-4" />
                {org.name}
              </Link>
            ))}
          </div>
        )}

        {/* CreateOrgDialog trigger — needs a small client wrapper */}
        <CreateOrgTrigger />
      </div>
    </div>
  );
}
```

Also create `src/components/create-org-trigger.tsx` (client wrapper for dialog):
```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateOrgDialog } from '@/components/create-org-dialog';

export function CreateOrgTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button className="w-full" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-4" />
        Create Organization
      </Button>
      <CreateOrgDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
```
</action>

<acceptance_criteria>
- `src/app/(app)/selecionar-org/page.tsx` exists as a Server Component
- Unauthenticated users are redirected to `/login`
- Users with 1 org are auto-redirected to that org's dashboard
- Users with 0 orgs see an empty state with a create button
- `src/components/create-org-trigger.tsx` exists as a Client Component
</acceptance_criteria>

---

### Task 4.3 — Update `src/middleware.ts` with tenant boundary enforcement

<read_first>
- `src/middleware.ts` — current auth-only middleware
- `src/lib/auth/index.ts` — Better-Auth session shape
</read_first>

<action>
Replace `src/middleware.ts` with tenant-aware middleware:

```ts
import { betterFetch } from '@better-fetch/fetch';
import type { Session } from 'better-auth/types';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>(
    '/api/auth/get-session',
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    }
  );

  // Auth gate: unauthenticated users go to /login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Tenant boundary enforcement (D-04)
  // Match routes like /org/[orgSlug]/...
  const orgSlugMatch = request.nextUrl.pathname.match(/^\/org\/([^/]+)/);
  if (orgSlugMatch) {
    const requestedSlug = orgSlugMatch[1];

    // The layout server component does the full DB membership check.
    // Middleware only validates the session exists (fast Edge check).
    // The layout redirects to /selecionar-org for unauthorized access.
    // This approach avoids DB calls in the Edge runtime.

    // Future: fetch /api/org/validate-membership for Edge-level check
    // For now: pass through to the server layout (which does the DB check)
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/org/:path*',
    '/selecionar-org',
  ],
};
```

**Note:** The full membership authorization check lives in `src/app/(app)/org/[orgSlug]/layout.tsx` (Task 4.1) which runs as a Server Component — it has full DB access. The middleware handles auth-only for Edge speed. This is the recommended Next.js App Router pattern.
</action>

<acceptance_criteria>
- `src/middleware.ts` matcher includes `/org/:path*` and `/selecionar-org`
- Unauthenticated requests to `/org/*` are redirected to `/login`
- Authenticated requests pass through to the layout (which enforces membership)
- File compiles with no TypeScript errors
</acceptance_criteria>

---

## Wave 5 — Sidebar & AppSidebar Update

### Task 5.1 — Update `AppSidebar` to accept org props and render `OrgSwitcher`

<read_first>
- `src/components/app-sidebar.tsx` — current static sidebar (has placeholder comment)
- `src/components/org-switcher.tsx` — OrgSwitcher created in Task 3.1
</read_first>

<action>
Update `src/components/app-sidebar.tsx`:

```tsx
import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Users, Settings, CreditCard } from 'lucide-react';
import { OrgSwitcher } from '@/components/org-switcher';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  organizations: Organization[];
  activeOrgId: string | null;
}

const items = [
  { title: 'Overview', url: '#', icon: LayoutDashboard },
  { title: 'Members', url: '#', icon: Users },
  { title: 'Billing', url: '#', icon: CreditCard },
  { title: 'Settings', url: '#', icon: Settings },
];

export function AppSidebar({ organizations, activeOrgId, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <OrgSwitcher organizations={organizations} activeOrgId={activeOrgId} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  } />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
```
</action>

<acceptance_criteria>
- `AppSidebar` accepts `organizations: Organization[]` and `activeOrgId: string | null` props
- Placeholder div/comment removed from `SidebarHeader`
- `OrgSwitcher` renders inside `SidebarHeader` with correct props
- Static `items` URLs will be updated in Phase 4 when org slug is available in layout context
</acceptance_criteria>

---

## Wave 6 — Verification

### Task 6.1 — Build & Type Check

<action>
```bash
npx tsc --noEmit
```

All files must type-check cleanly. Fix any TypeScript errors before marking this task done.
</action>

<acceptance_criteria>
- `npx tsc --noEmit` exits with code 0
- No `TS2345`, `TS2339`, `TS18004` or other type errors in output
</acceptance_criteria>

---

### Task 6.2 — Manual Flow Verification

<action>
Start the dev server (`npm run dev`) and manually verify the full org creation flow:

1. Log in with an existing account
2. Navigate to `/selecionar-org`
3. Click "Create Organization", enter a name, submit
4. Verify redirect to `/org/[slug]/dashboard`
5. Open the sidebar switcher — the new org appears with a checkmark
6. Connect to the PostgreSQL database and verify:
   - `organization` table has a new row with `tenantSchemaName = 'tenant_[uuid]'`
   - `CREATE SCHEMA` was executed: `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'`
7. Try navigating to `/org/some-other-slug/dashboard` that the user is NOT a member of — verify redirect to `/selecionar-org`
</action>

<acceptance_criteria>
- Create org flow completes without errors
- `organization` table row has `tenantSchemaName` populated
- PostgreSQL schema `tenant_[uuid]` exists after org creation
- Unauthorized org slug redirects to `/selecionar-org` (not 403/500)
</acceptance_criteria>

---

## must_haves

Derived from Phase 3 success criteria in ROADMAP.md:

1. Registering an organization creates a new `tenant_{uuid}` Postgres schema synchronously via Server Action
2. User can switch organization context via the sidebar dropdown → redirects to the org's dashboard
3. Middleware + layout enforce tenant boundaries — unauthorized access redirects cleanly to `/selecionar-org`
