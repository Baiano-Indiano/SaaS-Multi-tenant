import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getProjectsAction } from "@/app/actions/projects";
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
import { Plus, FolderKanban, LayoutGrid } from "lucide-react";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ProjectActions } from "@/components/projects/ProjectActions";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function ProjectsPage({ params }: PageProps) {
  const { orgSlug } = await params;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
            <LayoutGrid className="h-8 w-8 text-primary" />
            Projects
          </h1>
          <p className="text-muted-foreground">
            Manage your organization&apos;s isolated projects and boards.
          </p>
        </div>
        <CreateProjectDialog orgId={org.id} orgSlug={org.slug ?? ""} />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 bg-muted/30">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <FolderKanban className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">No projects found</h3>
          <p className="text-muted-foreground text-center max-w-sm mt-2 mb-6">
            This organization doesn&apos;t have any projects yet. Projects created here are strictly isolated to this tenant.
          </p>
          <CreateProjectDialog orgId={org.id} orgSlug={org.slug ?? ""} trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create First Project
            </Button>
          } />
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Project Name</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Created At</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project: { id: string; name: string; description: string | null; status: string; createdAt: Date }) => (
                <TableRow key={project.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold decoration-primary/30 underline-offset-4">{project.name}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">{project.description || "No description"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize border-primary/20 bg-primary/5 text-primary">
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm font-medium">
                    {new Date(project.createdAt).toLocaleDateString(undefined, {
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
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
