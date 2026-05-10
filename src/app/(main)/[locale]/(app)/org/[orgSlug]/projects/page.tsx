import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getProjectsAction } from "@/app/actions/projects";
import { 
  Table, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, LayoutGrid } from "lucide-react";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ProjectActions } from "@/components/projects/ProjectActions";
import { AnimatedTableBody } from "@/components/animations/animated-table-body";
import { GsapEntrance } from "@/components/ui/gsap-entrance";
import { getTranslations, getFormatter } from "next-intl/server";

interface PageProps {
  params: Promise<{ orgSlug: string; locale: string }>;
}

export default async function ProjectsPage({ params }: PageProps) {
  const { orgSlug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Projects" });
  const format = await getFormatter({ locale });
  
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) redirect("/selecionar-org");

  // Fetch projects using our hardened isolation action
  const projects = await getProjectsAction(org.id);

  return (
    <div className="space-y-8 container py-10">
      <GsapEntrance type="slide" y={20} duration={0.6} stagger={0.08}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <LayoutGrid className="h-8 w-8 text-primary" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground">
              {t("description")}
            </p>
          </div>
          <CreateProjectDialog orgId={org.id} orgSlug={org.slug ?? ""} />
        </div>
      </GsapEntrance>

      {projects.length === 0 ? (
        <GsapEntrance type="fade" duration={0.7} delay={0.15}>
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 bg-muted/30">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <FolderKanban className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">{t("noneFound")}</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-2 mb-6">
              {t("noProjectsDesc")}
            </p>
            <CreateProjectDialog orgId={org.id} orgSlug={org.slug ?? ""} trigger={
              <Button className="font-semibold shadow-sm hover:shadow-md transition-all ring-offset-background">
                <Plus className="h-4 w-4" />
                {t("createFirst")}
              </Button>
            } />
          </div>
        </GsapEntrance>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">{t("table.name")}</TableHead>
                <TableHead className="font-bold">{t("table.status")}</TableHead>
                <TableHead className="font-bold">{t("table.createdAt")}</TableHead>
                <TableHead className="text-right font-bold">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <AnimatedTableBody rowKeys={projects.map((project: { id: string }) => project.id)}>
              {projects.map((project: { id: string; name: string; description: string | null; status: string; createdAt: Date }) => (
                <TableRow key={project.id} data-flip-id={project.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold decoration-primary/30 underline-offset-4">{project.name}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">{project.description || t("noDescription")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize border-primary/20 bg-primary/5 text-primary">
                      {t(`status.${project.status as "active" | "archived"}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm font-medium">
                    {format.dateTime(new Date(project.createdAt), {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <ProjectActions 
                      projectId={project.id} 
                      orgId={org.id} 
                      orgSlug={org.slug ?? ""} 
                    />
                  </TableCell>
                </TableRow>
              ))}
            </AnimatedTableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
