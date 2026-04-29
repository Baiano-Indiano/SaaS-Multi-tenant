import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getProjectAction } from "@/app/actions/projects";
import { ProjectSettingsForm } from "@/components/projects/ProjectSettingsForm";
import { 
  ChevronLeft, 
  Settings,
  LayoutDashboard,
  FolderOpen
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

interface ProjectSettingsPageProps {
  params: Promise<{
    locale: string;
    orgSlug: string;
    projectId: string;
  }>;
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const { orgSlug, projectId } = await params;
  const t = await getTranslations("Projects");
  
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  // 1. Resolve Org ID
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) {
    return notFound();
  }

  // 2. Fetch Project Data (with tenant isolation)
  const project = await getProjectAction(org.id, projectId);

  if (!project) {
    return notFound();
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Breadcrumbs & Navigation */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href={`/org/${orgSlug}/dashboard`} className="hover:text-zinc-200 transition-colors flex items-center gap-1">
            <LayoutDashboard className="h-3.5 w-3.5" />
            {t("settings.breadcrumbDashboard")}
          </Link>
          <span className="text-zinc-700">/</span>
          <Link href={`/org/${orgSlug}/projects`} className="hover:text-zinc-200 transition-colors flex items-center gap-1">
            <FolderOpen className="h-3.5 w-3.5" />
            {t("settings.breadcrumbProjects")}
          </Link>
          <span className="text-zinc-700">/</span>
          <Link href={`/org/${orgSlug}/projects/${projectId}`} className="hover:text-zinc-200 transition-colors">
            {project.name}
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-200">{t("settings.breadcrumbSettings")}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/org/${orgSlug}/projects/${projectId}`}>
              <Button variant="ghost" size="icon" className="rounded-full border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
                <Settings className="h-8 w-8 text-indigo-500" />
                {t("settings.title")}
              </h1>
              <p className="text-zinc-400 mt-1">
                {t("settings.description", { name: project.name })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form Wrapper */}
      <div className="mt-4">
        <ProjectSettingsForm 
          project={{
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            orgId: org.id
          }} 
          orgSlug={orgSlug} 
        />
      </div>
    </div>
  );
}
