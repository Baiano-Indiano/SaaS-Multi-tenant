import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { organizations, members, roles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getTenantDb } from "@/lib/db/tenant-db";
import { PlaygroundClient } from "@/components/developers/playground/playground-client";

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/login");
  }

  // 1. Fetch organization
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) {
    notFound();
  }

  // 2. Verify membership
  const membership = await db
    .select()
    .from(members)
    .where(
      and(
        eq(members.organizationId, org.id),
        eq(members.userId, session.user.id)
      )
    )
    .limit(1);

  if (membership.length === 0) {
    redirect("/selecionar-org");
  }

  // 3. Fetch roles to find the 'admin' one for the shortcut key
  let adminRoleId: string | null = null;
  try {
    const tenantRoles = await getTenantDb(session.user.id, org.id, async (tx) => {
      return await tx.select().from(roles);
    });

    // Try to find 'admin' role, fallback to any if not found
    const adminRole = tenantRoles.find(r => r.slug === "admin") || tenantRoles[0];
    adminRoleId = adminRole?.id || null;
  } catch (error) {
    console.error("[Playground] Error fetching roles:", error);
  }

  return (
    <div className="h-full flex flex-col">
      <PlaygroundClient 
        orgId={org.id} 
        orgSlug={orgSlug}
        adminRoleId={adminRoleId}
      />
    </div>
  );
}
