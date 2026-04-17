import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getRolesWithPermissions, can } from "@/lib/auth/rbac-utils";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Shield } from "lucide-react";
import { RoleDialog } from "@/components/rbac/RoleDialog";
import { RoleActions } from "@/components/rbac/RoleActions";

export default async function RolesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/login");

  // 1. Fetch organization
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) redirect("/selecionar-org");

  // 2. Security Check: Can this user manage roles?
  const hasAccess = await can(session.user.id, org.id, "roles:manage");
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Shield className="h-12 w-12 text-zinc-700 mb-4" />
        <h3 className="text-xl font-semibold text-zinc-100">Access Denied</h3>
        <p className="text-zinc-400 max-w-sm mx-auto">
          You don&apos;t have the required permissions to manage roles in this organization.
        </p>
      </div>
    );
  }

  // 3. Fetch Roles
  const roles = await getRolesWithPermissions(org.tenantSchemaName!);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-zinc-100">Roles & Permissions</h3>
          <p className="text-sm text-zinc-400">
            Manage your organization&apos;s roles and their permissions.
          </p>
        </div>
        <RoleDialog 
          orgId={org.id} 
          orgSlug={orgSlug}
          trigger={
            <Button className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200">
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          }
        />
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-950/50">
        <Table>
          <TableHeader className="bg-zinc-900/50">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Role Name</TableHead>
              <TableHead className="text-zinc-400">Permissions</TableHead>
              <TableHead className="text-zinc-400">Created At</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id} className="border-zinc-800 hover:bg-zinc-900/30 transition-colors">
                <TableCell className="font-medium text-zinc-100">
                  <div className="flex flex-col">
                    <span>{role.name}</span>
                    <span className="text-xs text-zinc-500 font-normal">
                      {role.description || "No description"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5 max-w-md">
                    {role.permissions.map((p) => (
                      <Badge 
                        key={p} 
                        variant="secondary" 
                        className="bg-zinc-800/50 text-zinc-300 border-zinc-700 text-[10px] px-1.5 py-0"
                      >
                        {PERMISSIONS[p]?.name || p}
                      </Badge>
                    ))}
                    {role.permissions.length === 0 && (
                      <span className="text-zinc-600 text-xs italic">No permissions</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-zinc-400 text-xs text-nowrap">
                  {new Date(role.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <RoleActions 
                    role={role} 
                    orgId={org.id} 
                    orgSlug={orgSlug} 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
