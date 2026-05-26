import { db } from "@/lib/db";
import { withAdminTenantDb } from "@/lib/db/tenant-db";
import { projects, members, auditLogs, webhookDeliveries, organizations, webhooks } from "@/lib/db/schema";
import { eq, gte, desc } from "drizzle-orm";
import { jsPDF } from "jspdf";

export interface OrgReportData {
  orgName: string;
  orgSlug: string;
  plan: string;
  metrics: {
    projectsCount: number;
    newProjectsCount: number;
    membersCount: number;
    newMembersCount: number;
    webhooksCount: number;
    webhookDeliveriesCount: number;
    webhookSuccessCount: number;
    webhookFailedCount: number;
  };
  recentLogs: Array<{
    id: string;
    userName: string;
    userEmail: string;
    action: string;
    entityType: string;
    createdAt: Date;
  }>;
}

/**
 * generateOrgReportData
 * 
 * Fetches organization metrics and recent audit logs over the last 7 days.
 * Operates in a read-only transaction on the tenant-specific schema.
 */
export async function generateOrgReportData(orgId: string): Promise<OrgReportData> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return await withAdminTenantDb(orgId, async (tx) => {
    // 1. Projects metrics (tenant-side)
    const allProjects = await tx.select().from(projects);
    const newProjects = allProjects.filter(p => p.createdAt >= sevenDaysAgo);

    // 2. Members metrics (public schema members, isolated logically)
    const orgMembers = await tx.select().from(members).where(eq(members.organizationId, orgId));
    const newMembers = orgMembers.filter(m => m.createdAt >= sevenDaysAgo);

    // 3. Webhooks (tenant-side)
    const allWebhooks = await tx.select().from(webhooks);

    // 4. Webhook Deliveries (tenant-side)
    const recentDeliveries = await tx
      .select()
      .from(webhookDeliveries)
      .where(gte(webhookDeliveries.createdAt, sevenDaysAgo));

    const totalDeliveries = recentDeliveries.length;
    const successDeliveries = recentDeliveries.filter(d => d.status === "delivered").length;
    const failedDeliveries = recentDeliveries.filter(d => d.status === "failed").length;

    // 5. Recent audit logs (tenant-side)
    const logs = await tx
      .select({
        id: auditLogs.id,
        userName: auditLogs.userName,
        userEmail: auditLogs.userEmail,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, sevenDaysAgo))
      .orderBy(desc(auditLogs.createdAt))
      .limit(20);

    return {
      orgName: org.name,
      orgSlug: org.slug || "",
      plan: org.plan,
      metrics: {
        projectsCount: allProjects.length,
        newProjectsCount: newProjects.length,
        membersCount: orgMembers.length,
        newMembersCount: newMembers.length,
        webhooksCount: allWebhooks.length,
        webhookDeliveriesCount: totalDeliveries,
        webhookSuccessCount: successDeliveries,
        webhookFailedCount: failedDeliveries,
      },
      recentLogs: logs,
    };
  }, { mode: "reader" });
}

/**
 * generatePdfReport
 * 
 * Compiles report metrics and activity logs into a formatted PDF using jsPDF.
 * Returns the output as a Node.js Buffer suitable for download streams.
 */
export function generatePdfReport(orgName: string, data: OrgReportData): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  // Page boundaries (A4: 210 x 297 mm)
  // Draw header background block
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Organization Report", 15, 18);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Organization: ${orgName} (${data.orgSlug})`, 15, 26);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} | Plan: ${data.plan.toUpperCase()}`, 15, 32);
  
  // Horizontal divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(15, 45, 195, 45);
  
  // Key Metrics header
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Key Metrics (Last 7 Days)", 15, 54);
  
  // Layout Metrics cards
  const cardWidth = 56;
  const cardHeight = 25;
  const cardY = 60;
  
  // Projects card
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(15, cardY, cardWidth, cardHeight, "F");
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.rect(15, cardY, cardWidth, cardHeight, "S");
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFontSize(9);
  doc.text("PROJECTS", 19, cardY + 6);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(16);
  doc.text(`${data.metrics.projectsCount}`, 19, cardY + 15);
  doc.setTextColor(34, 197, 94); // green-500
  doc.setFontSize(8);
  doc.text(`+${data.metrics.newProjectsCount} this week`, 19, cardY + 21);
  
  // Team members card
  doc.setFillColor(248, 250, 252);
  doc.rect(15 + cardWidth + 5, cardY, cardWidth, cardHeight, "F");
  doc.rect(15 + cardWidth + 5, cardY, cardWidth, cardHeight, "S");
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text("TEAM MEMBERS", 15 + cardWidth + 9, cardY + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.text(`${data.metrics.membersCount}`, 15 + cardWidth + 9, cardY + 15);
  doc.setTextColor(34, 197, 94);
  doc.setFontSize(8);
  doc.text(`+${data.metrics.newMembersCount} this week`, 15 + cardWidth + 9, cardY + 21);
  
  // Webhooks card
  doc.setFillColor(248, 250, 252);
  doc.rect(15 + (cardWidth + 5) * 2, cardY, cardWidth, cardHeight, "F");
  doc.rect(15 + (cardWidth + 5) * 2, cardY, cardWidth, cardHeight, "S");
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text("WEBHOOK DELIVERIES", 15 + (cardWidth + 5) * 2 + 4, cardY + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  const successRate = data.metrics.webhookDeliveriesCount > 0 
    ? ((data.metrics.webhookSuccessCount / data.metrics.webhookDeliveriesCount) * 100).toFixed(1)
    : "100";
  doc.text(`${data.metrics.webhookDeliveriesCount} (${successRate}% success)`, 15 + (cardWidth + 5) * 2 + 4, cardY + 14);
  doc.setTextColor(239, 68, 68); // red-500
  doc.setFontSize(8);
  doc.text(`${data.metrics.webhookFailedCount} failures`, 15 + (cardWidth + 5) * 2 + 4, cardY + 21);
  
  // Audit activity list header
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Recent Activity Log", 15, 100);
  
  // Table columns definition
  let currentY = 108;
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text("Timestamp", 15, currentY);
  doc.text("User", 55, currentY);
  doc.text("Action", 110, currentY);
  doc.text("Entity", 165, currentY);
  
  // Underline table headers
  doc.setDrawColor(203, 213, 225);
  doc.line(15, currentY + 2, 195, currentY + 2);
  
  currentY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  
  if (data.recentLogs && data.recentLogs.length > 0) {
    for (const log of data.recentLogs) {
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text("Timestamp", 15, currentY);
        doc.text("User", 55, currentY);
        doc.text("Action", 110, currentY);
        doc.text("Entity", 165, currentY);
        doc.line(15, currentY + 2, 195, currentY + 2);
        
        currentY += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
      }
      
      const dateStr = new Date(log.createdAt).toLocaleString();
      const userStr = log.userEmail.length > 25 ? log.userEmail.substring(0, 23) + "..." : log.userEmail;
      const actionStr = log.action.length > 25 ? log.action.substring(0, 23) + "..." : log.action;
      const entityStr = log.entityType;
      
      doc.text(dateStr, 15, currentY);
      doc.text(userStr, 55, currentY);
      doc.text(actionStr, 110, currentY);
      doc.text(entityStr, 165, currentY);
      
      // Separator line
      doc.setDrawColor(241, 245, 249);
      doc.line(15, currentY + 2, 195, currentY + 2);
      currentY += 7;
    }
  } else {
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("No recent activity recorded in the last 7 days.", 15, currentY);
  }
  
  // Render page numbering in footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages}`, 195, 290, { align: "right" });
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
