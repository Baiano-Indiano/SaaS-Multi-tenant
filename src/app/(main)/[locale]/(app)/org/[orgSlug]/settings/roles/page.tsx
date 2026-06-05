import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getRolesWithPermissions, can } from "@/lib/auth/rbac-utils";
import { Button } from "@/components/ui/button";
import { Plus, ShieldAlert } from "lucide-react";
import { RoleDialog } from "@/components/rbac/RoleDialog";
import { RolesList } from "@/components/rbac/RolesList";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("RBAC");
  
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] text-center p-6 rounded-2xl border border-zinc-800/50 bg-zinc-950/20 shadow-2xl">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-full" />
          <ShieldAlert className="h-16 w-16 text-zinc-600 relative" />
        </div>
        <h3 className="text-2xl font-bold text-zinc-100 tracking-tight mb-2">{t("accessRestricted")}</h3>
        <p className="text-zinc-400 max-w-sm mx-auto leading-relaxed">
          {t("accessRestrictedDesc")}
        </p>
      </div>
    );
  }

  // 3. Fetch Roles
  const roles = await getRolesWithPermissions(org.id);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-zinc-100">{t("title")}</h1>
          <p className="text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            {t("description")}
          </p>
        </div>
        <RoleDialog 
          orgId={org.id} 
          orgSlug={orgSlug}
          trigger={
            <Button className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all font-medium h-11 px-6">
              <Plus className="mr-2 h-5 w-5" />
              {t("createCustomRole")}
            </Button>
          }
        />
      </div>

      <RolesList 
        roles={roles} 
        orgId={org.id} 
        orgSlug={orgSlug} 
      />
    </div>
  );
}
