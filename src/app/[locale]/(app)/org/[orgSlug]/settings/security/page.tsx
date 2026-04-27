import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ShieldCheck, Lock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Org2FAEnforcement } from "@/components/security/org-2fa-enforcement";
import { can } from "@/lib/auth/rbac-utils";

export default async function SecuritySettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/login");

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) redirect("/selecionar-org");

  // RBAC Check
  const hasPermission = await can(session.user.id, org.id, "security:manage");
  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <div className="p-4 bg-red-500/10 rounded-full">
          <Lock className="h-10 w-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-zinc-100">Access Denied</h3>
          <p className="text-zinc-500 max-w-xs mx-auto">
            You do not have the required permissions to manage security policies for this organization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h3 className="text-2xl font-bold text-zinc-100 flex items-center gap-2 tracking-tight">
          <ShieldCheck className="h-6 w-6 text-emerald-500" />
          Security Policies
        </h3>
        <p className="text-sm text-zinc-400 mt-1">
          Configure security requirements and authentication policies for your organization members.
        </p>
      </div>

      <Separator className="bg-zinc-900" />

      <div className="grid gap-8">
        <Org2FAEnforcement 
          organizationId={org.id} 
          initialEnabled={org.require2FA} 
        />

        <div className="bg-zinc-950/20 border border-zinc-900 border-dashed rounded-xl p-8">
          <div className="flex gap-4">
            <div className="p-2 bg-zinc-900/50 rounded-lg h-fit">
              <Lock className="h-5 w-5 text-zinc-600" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-zinc-400">Additional Security Controls</h4>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl">
                Upcoming features include Session Persistence management, IP Whitelisting, and Advanced Audit Log exports. 
                Manage member sessions directly from the <strong>Members</strong> tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
