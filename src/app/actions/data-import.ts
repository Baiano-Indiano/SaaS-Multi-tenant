"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTenantDb } from "@/lib/db/tenant-db";
import { users, members as membersTable, roles as rolesTable, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac-utils";
import { logger } from "@/lib/logger";
import { recordAuditLog } from "@/lib/audit";

/**
 * Parses a standard CSV string into an array of objects.
 * Handles double quotes, commas inside fields, and escaped quotes.
 */
function parseCSV(csvText: string): any[] {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseCSVLine(lines[0]);
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row: any = {};
    headers.forEach((header, index) => {
      const key = header.trim();
      row[key] = values[index] !== undefined ? values[index] : null;
    });
    rows.push(row);
  }

  return rows;
}

export async function importTenantDataAction(
  input: FormData | {
    orgId: string;
    orgSlug: string;
    fileContent: string;
    fileName: string;
  }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    logger.warn("action", "importTenantDataAction aborted: Unauthenticated access attempt");
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  let orgId: string;
  let orgSlug: string;
  let fileContent: string;
  let fileName: string;

  if (input instanceof FormData) {
    orgId = input.get("orgId") as string;
    orgSlug = input.get("orgSlug") as string;
    fileName = (input.get("fileName") as string) || "import.json";
    const file = input.get("file");
    if (!file) {
      return { success: false, error: "Nenhum arquivo enviado." };
    }
    if (typeof file === "string") {
      fileContent = file;
    } else {
      fileContent = await (file as File).text();
      fileName = (file as File).name;
    }
  } else {
    orgId = input.orgId;
    orgSlug = input.orgSlug;
    fileContent = input.fileContent;
    fileName = input.fileName;
  }

  if (!orgId || !orgSlug || !fileContent || !fileName) {
    return { success: false, error: "Parâmetros inválidos ou ausentes." };
  }

  logger.info("action", `importTenantDataAction initiated by User ${session.user.id} in Org ${orgId} with file: ${fileName}`);

  try {
    // RBAC: Verify user has 'org:update' permission to perform migration imports
    await requirePermission(session.user.id, orgId, "org:update");

    // Detect format: CSV or JSON
    const isCsv =
      fileName.toLowerCase().endsWith(".csv") ||
      (!fileContent.trim().startsWith("{") && !fileContent.trim().startsWith("["));

    let projectsToImport: any[] = [];
    let membersToImport: any[] = [];

    if (isCsv) {
      const parsedRows = parseCSV(fileContent);
      if (parsedRows.length > 0) {
        const sampleKeys = Object.keys(parsedRows[0]).map((k) => k.toLowerCase());
        if (
          sampleKeys.includes("email") ||
          sampleKeys.includes("useremail") ||
          sampleKeys.includes("role")
        ) {
          membersToImport = parsedRows;
        } else {
          projectsToImport = parsedRows;
        }
      }
    } else {
      const parsed = JSON.parse(fileContent);
      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed)) {
          if (parsed.length > 0) {
            const first = parsed[0];
            if (first.email || first.userEmail || first.role) {
              membersToImport = parsed;
            } else {
              projectsToImport = parsed;
            }
          }
        } else {
          if (Array.isArray(parsed.projects)) {
            projectsToImport = parsed.projects;
          }
          if (Array.isArray(parsed.members)) {
            membersToImport = parsed.members;
          }
          // Fallback check: single object represents a project or member
          if (projectsToImport.length === 0 && membersToImport.length === 0) {
            if (parsed.email || parsed.userEmail || parsed.role) {
              membersToImport = [parsed];
            } else if (parsed.name) {
              projectsToImport = [parsed];
            }
          }
        }
      }
    }

    if (projectsToImport.length === 0 && membersToImport.length === 0) {
      return { success: false, error: "Nenhum dado válido de projetos ou membros foi encontrado no arquivo." };
    }

    // Execute database operations inside an isolated tenant-context transaction
    const counts = await getTenantDb(session.user.id, orgId, async (tx) => {
      let importedProjectsCount = 0;
      let importedMembersCount = 0;

      // 1. Fetch tenant-defined roles for role resolution
      const tenantRoles = await tx.select().from(rolesTable);
      const roleMap = new Map(tenantRoles.map((r) => [r.slug.toLowerCase(), r]));
      tenantRoles.forEach((r) => {
        roleMap.set(r.name.toLowerCase(), r);
      });
      const defaultRole = tenantRoles.find((r) => r.slug === "member") || tenantRoles[0];

      // 2. Import Projects
      for (const proj of projectsToImport) {
        const name = proj.name || proj.projectName;
        if (!name) continue;

        const projectId = proj.id || crypto.randomUUID();
        const description = proj.description || proj.desc || null;
        const status = proj.status || "active";
        const userId = proj.userId || session.user.id;
        const createdAt = proj.createdAt ? new Date(proj.createdAt) : new Date();
        const updatedAt = proj.updatedAt ? new Date(proj.updatedAt) : new Date();

        // Check if project already exists
        const existing = await tx
          .select()
          .from(projects)
          .where(eq(projects.id, projectId))
          .limit(1);

        if (existing.length > 0) {
          // Update
          await tx
            .update(projects)
            .set({
              name,
              description,
              status,
              userId,
              updatedAt: new Date(),
            })
            .where(eq(projects.id, projectId));
        } else {
          // Insert
          await tx.insert(projects).values({
            id: projectId,
            name,
            description,
            status,
            userId,
            createdAt,
            updatedAt,
          });
        }
        importedProjectsCount++;
      }

      // 3. Import Members
      for (const m of membersToImport) {
        const email = m.email || m.userEmail || m.memberEmail;
        if (!email) continue;

        const roleSlug = String(m.role || "member").toLowerCase();
        const roleRecord = roleMap.get(roleSlug) || defaultRole;
        if (!roleRecord) continue;

        // Find or create user in public user table
        const userRecords = await tx
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        let user = userRecords[0];

        let userId = user?.id;
        if (!user) {
          userId = m.userId || `user_${crypto.randomUUID()}`;
          const name = m.userName || m.name || email.split("@")[0];
          await tx.insert(users).values({
            id: userId,
            name,
            email,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Link user to organization in member table
        const existingMemberRecords = await tx
          .select()
          .from(membersTable)
          .where(
            and(
              eq(membersTable.userId, userId!),
              eq(membersTable.organizationId, orgId)
            )
          )
          .limit(1);
        const existingMember = existingMemberRecords[0];

        if (existingMember) {
          // Update role if already member
          await tx
            .update(membersTable)
            .set({
              role: roleRecord.slug,
              roleId: roleRecord.id,
            })
            .where(eq(membersTable.id, existingMember.id));
        } else {
          // Insert new member connection
          const memberId = m.id || `member_${crypto.randomUUID()}`;
          await tx.insert(membersTable).values({
            id: memberId,
            organizationId: orgId,
            userId: userId!,
            role: roleRecord.slug,
            roleId: roleRecord.id,
            createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
          });
        }
        importedMembersCount++;
      }

      return { projectsCount: importedProjectsCount, membersCount: importedMembersCount };
    });

    // Revalidate paths for page updates
    revalidatePath(`/org/${orgSlug}/projects`);
    revalidatePath(`/org/${orgSlug}/members`);

    // Record Audit Log (Phase 45)
    await recordAuditLog({
      organizationId: orgId,
      action: "DATA_IMPORTED",
      entityType: "ORGANIZATION",
      entityId: orgId,
      details: `Imported portability data: ${counts.projectsCount} projects and ${counts.membersCount} members from file "${fileName}"`,
      actor: {
        id: session.user.id,
        name: session.user.name || "Unknown",
        email: session.user.email,
      },
    });

    logger.info("action", `importTenantDataAction completed successfully. Imported: ${counts.projectsCount} projects, ${counts.membersCount} members.`);
    
    return {
      success: true,
      importedProjects: counts.projectsCount,
      importedMembers: counts.membersCount,
    };

  } catch (error) {
    logger.error("action", `importTenantDataAction failed for Org ${orgId}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Falha ao processar o arquivo de importação.",
    };
  }
}
