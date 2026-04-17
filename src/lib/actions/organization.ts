'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizations, members } from '@/lib/db/schema';
import { createTenantSchema } from '@/lib/db/tenant';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export type CreateOrgState = {
  error?: string;
};

export async function createOrganizationAction(
  _prevState: CreateOrgState,
  formData: FormData
): Promise<CreateOrgState> {
  // Security (T-04): Validate session before any mutation
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: 'Unauthorized' };
  }

  const name = (formData.get('name') as string)?.trim();
  if (!name || name.length < 2 || name.length > 64) {
    return { error: 'Organization name must be between 2 and 64 characters' };
  }

  // Generate slug from name (lowercase, hyphens only)
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Use Better-Auth organization plugin to create org (handles ID generation)
  const org = await auth.api.createOrganization({
    body: { name, slug },
    headers: await headers(),
  });

  if (!org) {
    return { error: 'Failed to create organization' };
  }

  // Security (T-01): Schema name is always tenant_{uuid} — never user input
  const tenantSchemaName = `tenant_${org.id}`;

  // Persist the tenantSchemaName on the organization record
  await db
    .update(organizations)
    .set({ tenantSchemaName })
    .where(eq(organizations.id, org.id));

  // Synchronously create the Postgres schema for this tenant (D-05)
  // and seed it with default roles.
  const tenantResult = await createTenantSchema(tenantSchemaName);

  if (tenantResult && tenantResult.adminRoleId) {
    // Link the creator to the Administrator role (T-03)
    await db
      .update(members)
      .set({ roleId: tenantResult.adminRoleId })
      .where(
        and(
          eq(members.organizationId, org.id),
          eq(members.userId, session.user.id)
        )
      );
  }

  // Set the new org as the active organization and redirect to its dashboard
  await auth.api.setActiveOrganization({
    body: { organizationId: org.id },
    headers: await headers(),
  });

  redirect(`/org/${slug}/dashboard`);
}

