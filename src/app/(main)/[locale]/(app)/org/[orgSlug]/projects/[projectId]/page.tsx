import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { getProjectAction } from "@/app/actions/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  Layout, 
  Calendar, 
  User, 
  Activity,
  BarChart3,
  CheckCircle2,
  Clock
} from "lucide-react";
import Link from "next/link";
import { MagneticCard } from "@/components/dashboard/MagneticCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

interface PageProps {
  params: Promise<{ locale: string; orgSlug: string; projectId: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { locale, orgSlug, projectId } = await params;
  const t = await getTranslations("Projects");
  
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) redirect("/selecionar-org");

  const project = await getProjectAction(org.id, projectId);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-8 container py-10">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link 
          href={`/org/${orgSlug}/projects`}
          className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors w-fit group"
        >
          <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {t("details.back")}
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                  <Layout className="h-8 w-8 text-primary" />
                </div>
                {project.name}
              </h1>
              <Badge variant="outline" className="h-6 px-3 font-bold uppercase tracking-widest text-[10px] bg-primary/5 border-primary/20 text-primary">
                {t(`status.${project.status as "active" | "archived"}`)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              {project.description || t("details.noDescription")}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href={`/org/${orgSlug}/projects/${projectId}/settings`}>
              <Button variant="outline" className="font-bold border-zinc-800">
                {t("details.settings")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <MagneticCard>
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent" />
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  {t("details.sidebarTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Calendar className="h-4 w-4" />
                    {t("details.created")}
                  </div>
                  <span className="text-sm font-medium text-white">
                    {new Date(project.createdAt).toLocaleDateString(locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Clock className="h-4 w-4" />
                    {t("details.updated")}
                  </div>
                  <span className="text-sm font-medium text-white">
                    {new Date(project.updatedAt).toLocaleDateString(locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <User className="h-4 w-4" />
                    {t("details.ownerId")}
                  </div>
                  <span className="text-xs font-mono text-zinc-500 truncate max-w-[100px]">
                    {project.userId}
                  </span>
                </div>
              </CardContent>
            </Card>
          </MagneticCard>

          <Card className="bg-zinc-900/20 border-zinc-800/50">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Activity className="h-3 w-3" />
                {t("details.liveStatus")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-emerald-500">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold">{t("details.synchronized")}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-zinc-900/30 border-zinc-800 border-dashed min-h-[400px] flex flex-col items-center justify-center p-12 group">
            <div className="rounded-full bg-zinc-900 border border-zinc-800 p-6 mb-4 group-hover:scale-110 transition-transform duration-500 ease-out-expo">
              <BarChart3 className="h-12 w-12 text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold text-zinc-300">
              {t("details.boardPlaceholderTitle")}
            </h3>
            <p className="text-zinc-500 text-center max-w-sm mt-2 mb-6">
              {t("details.boardPlaceholderDesc", { name: project.name })}
            </p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-zinc-600" />
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-800 w-1/2" />
                </div>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 flex items-center gap-3">
                <Clock className="h-5 w-5 text-zinc-600" />
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-800 w-1/3" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
