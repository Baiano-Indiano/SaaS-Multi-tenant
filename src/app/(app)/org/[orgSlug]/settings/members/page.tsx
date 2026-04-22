import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { members, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getRoles } from "@/lib/auth/rbac-utils";
import { 
  Table, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PermissionBoundary } from "@/components/rbac/PermissionBoundary";
import { RoleSelector, RemoveMemberButton } from "@/components/members/MemberActions";
import { InviteMemberDialog } from "@/components/members/InviteMemberDialog";
import { InvitationsTable } from "@/components/members/InvitationsTable";
import { getPendingInvitationsAction } from "@/app/actions/member";
import { AnimatedTableBody } from "@/components/animations/animated-table-body";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function MembersPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) redirect("/selecionar-org");

  // Fetch all members of this organization
  const orgMembers = await db.query.members.findMany({
    where: eq(members.organizationId, org.id),
    with: {
      user: true,
    }
  });

  // Fetch all roles available in this tenant
  // Fetch all roles available in this tenant
  const availableRoles = await getRoles(org.id);

  // Fetch pending invitations
  const pendingInvitations = await getPendingInvitationsAction(org.id);

  return (
    <div className="space-y-6 container py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">
            Manage your team and their access levels.
          </p>
        </div>
        <PermissionBoundary permissions="members:invite">
          <InviteMemberDialog 
            roles={availableRoles} 
            orgId={org.id} 
            orgSlug={org.slug ?? ""} 
          />
        </PermissionBoundary>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Equipe Atual</h2>
        <div className="rounded-md border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <AnimatedTableBody rowKeys={orgMembers.map((member) => member.id)}>
            {orgMembers.map((member) => (
              <TableRow key={member.id} data-flip-id={member.id}>
                <TableCell className="flex items-center gap-3 py-4">
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={member.user.image ?? ""} />
                    <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                      {member.user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm leading-none mb-1">{member.user.name}</span>
                    <span className="text-xs text-muted-foreground">{member.user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <PermissionBoundary 
                    permissions="roles:assign" 
                    fallback={<Badge variant="secondary" className="capitalize">{member.role}</Badge>}
                  >
                    <RoleSelector 
                      memberId={member.id} 
                      currentRoleId={member.roleId ?? ""} 
                      roles={availableRoles}
                      orgId={org.id}
                      orgSlug={org.slug ?? ""}
                    />
                  </PermissionBoundary>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm font-medium">
                  {new Date(member.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <PermissionBoundary permissions="members:remove">
                    {member.user.id !== session.user.id && (
                       <RemoveMemberButton 
                         memberId={member.id} 
                         orgId={org.id} 
                         orgSlug={org.slug ?? ""} 
                       />
                    )}
                  </PermissionBoundary>
                </TableCell>
              </TableRow>
            ))}
          </AnimatedTableBody>
        </Table>
      </div>

      <PermissionBoundary permissions="members:invite">
        <InvitationsTable 
          invitations={pendingInvitations} 
          orgId={org.id} 
          orgSlug={org.slug ?? ""} 
        />
      </PermissionBoundary>
      </div>
    </div>
  );
}
