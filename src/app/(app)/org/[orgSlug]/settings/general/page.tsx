import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

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
        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Settings className="h-5 w-5 text-zinc-400" />
          General Settings
        </h3>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your organization profile, basic information and global preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-zinc-950 border-zinc-800 shadow-xl shadow-black/40">
          <CardHeader>
            <CardTitle className="text-zinc-100">Organization Profile</CardTitle>
            <CardDescription className="text-zinc-400">
              Basic details about your team and how it appears to others.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Display Name</p>
                <p className="text-zinc-200 font-medium">{org.name}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Organization URL</p>
                <p className="text-zinc-400 font-mono text-sm bg-zinc-900/50 px-2 py-0.5 rounded w-fit">
                  /{org.slug}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Current Plan</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-zinc-100 text-zinc-950 hover:bg-zinc-100 font-bold px-3">
                    {org.plan?.toUpperCase() || "FREE"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Creation Date</p>
                <p className="text-zinc-400 text-sm">
                  {new Date(org.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/30 border border-zinc-900 border-dashed rounded-xl p-8 text-center">
          <CardContent className="p-0">
            <div className="mx-auto w-10 h-10 rounded-full bg-zinc-900/50 flex items-center justify-center mb-4 ring-1 ring-zinc-800">
              <Settings className="h-5 w-5 text-zinc-600" />
            </div>
            <p className="text-xs text-zinc-500 font-medium max-w-xs mx-auto">
              Additional features like custom branding, security policies and webhooks are being prepared for your organization.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
