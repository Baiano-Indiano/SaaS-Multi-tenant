import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/rbac-utils";
import { generateOrgReportData, generatePdfReport } from "@/lib/reports/generator";
import { recordAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/org/[orgSlug]/reports
 * 
 * Secure endpoint to download organization reports.
 * Validates session ownership and restricts route access using the standard RBAC `requirePermission` utility.
 * 
 * Query Params:
 * - format: "pdf" | "json" (default: "pdf")
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const start = Date.now();
  const { orgSlug } = await params;
  logger.info("api", `➜ GET /api/org/${orgSlug}/reports`);

  try {
    // 1. Authenticate user session
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      logger.warn("api", `GET /api/org/${orgSlug}/reports - Unauthorized`);
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Fetch organization context
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.slug, orgSlug),
    });

    if (!org) {
      logger.warn("api", `GET /api/org/${orgSlug}/reports - Organization not found`);
      return new NextResponse("Organization Not Found", { status: 404 });
    }

    // 3. Enforce RBAC validation check (requires audit logs view permission)
    try {
      await requirePermission(session.user.id, org.id, "audit_logs:read");
    } catch {
      logger.warn("api", `GET /api/org/${orgSlug}/reports - Forbidden for user ${session.user.id}`);
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 4. Parse output format parameter
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "pdf").toLowerCase();

    if (format !== "pdf" && format !== "json") {
      return new NextResponse("Invalid format parameter. Supported: pdf, json", { status: 400 });
    }

    // 5. Gather report datasets
    const reportData = await generateOrgReportData(org.id);

    // 6. Generate file payload and respond
    if (format === "pdf") {
      const pdfBuffer = generatePdfReport(org.name, reportData);

      // Log download audit event
      await recordAuditLog({
        organizationId: org.id,
        action: "REPORT_DOWNLOADED",
        entityType: "ORGANIZATION",
        entityId: org.id,
        details: { format: "pdf", period: "last-7-days" },
        actor: {
          id: session.user.id,
          name: session.user.name || "Unknown",
          email: session.user.email,
        }
      });

      const duration = Date.now() - start;
      logger.info("api", `✓ GET /api/org/${orgSlug}/reports | PDF | 200 | ${duration}ms`);

      return new NextResponse(pdfBuffer as any, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${orgSlug}-weekly-report.pdf"`,
        },
      });
    } else {
      // JSON format
      // Log download audit event
      await recordAuditLog({
        organizationId: org.id,
        action: "REPORT_DOWNLOADED",
        entityType: "ORGANIZATION",
        entityId: org.id,
        details: { format: "json", period: "last-7-days" },
        actor: {
          id: session.user.id,
          name: session.user.name || "Unknown",
          email: session.user.email,
        }
      });

      const duration = Date.now() - start;
      logger.info("api", `✓ GET /api/org/${orgSlug}/reports | JSON | 200 | ${duration}ms`);

      return new NextResponse(JSON.stringify(reportData, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${orgSlug}-activity-report.json"`,
        },
      });
    }

  } catch (error) {
    logger.error("api", `✗ GET /api/org/${orgSlug}/reports | Error`, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
