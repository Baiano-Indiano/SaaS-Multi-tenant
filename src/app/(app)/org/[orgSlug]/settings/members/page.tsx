import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTenantDb } from "@/lib/db/tenant-db";
import { MemberList } from "@/components/members/MemberList";
import { InviteMemberDialog } from "@/components/members/InviteMemberDialog";
import { Users } from "lucide-react";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/login");

  // 1. Get Org Info
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) redirect("/selecionar-org");

  // 2. Fetch Members and Roles using Tenant Context
  const { orgMembers, availableRoles } = await getTenantDb(
    session.user.id,
    org.id,
    async (tx) => {
      const orgMembers = await tx.query.members.findMany({
        where: (members, { eq }) => eq(members.organizationId, org.id),
        with: {
          user: true,
        },
        orderBy: (members, { desc }) => [desc(members.createdAt)],
      });

      const availableRoles = await tx.query.roles.findMany({
        orderBy: (roles, { asc }) => [asc(roles.name)],
      });

      return { orgMembers, availableRoles };
    }
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-zinc-400" />
            Team Members
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your team, invite new members and control their access levels.
          </p>
        </div>
        
        <InviteMemberDialog 
          roles={availableRoles} 
          orgId={org.id} 
          orgSlug={org.slug!} 
        />
      </div>

      <MemberList 
        members={orgMembers} 
        orgId={org.id} 
        orgSlug={org.slug!} 
        roles={availableRoles} 
      />

      <div className="bg-zinc-950/30 border border-zinc-900 border-dashed rounded-xl p-6 text-center">
        <p className="text-xs text-zinc-500 font-medium">
          Roles and permissions are managed per organization. Need custom roles? Upgrade to the Enterprise plan.
        </p>
      </div>
    </div>
  );
}
