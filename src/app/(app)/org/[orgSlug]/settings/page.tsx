import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function GeneralSettingsPage({
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-zinc-100">General Settings</h3>
        <p className="text-sm text-zinc-400">
          Manage your organization profile and basic information.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Organization Profile</CardTitle>
            <CardDescription className="text-zinc-400">
              Basic details about your team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</p>
                <p className="text-zinc-200">{org.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Slug</p>
                <p className="text-zinc-400 font-mono text-sm">/{org.slug}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Current Plan</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-zinc-100 text-zinc-950 hover:bg-zinc-100 capitaize">
                    {org.plan || "Free"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Created At</p>
                <p className="text-zinc-400 text-sm">
                  {new Date(org.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/50 border-zinc-900 border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-500 text-center">
              Additional settings like logo upload and custom domains coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
