import { Receiver } from "@upstash/qstash";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations, members, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateOrgReportData } from "@/lib/reports/generator";
import { resend } from "@/lib/mail";
import { logger } from "@/lib/logger";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "",
});

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/email-digest
 * GET /api/cron/email-digest (For manual trigger / testing)
 * 
 * Secure Cron route triggered by QStash.
 * Fetches all organizations, gathers weekly metrics and audit logs, and emails a digest to admins/owners.
 */
export async function POST(req: Request) {
  return handleCron(req);
}

export async function GET(req: Request) {
  return handleCron(req);
}

async function handleCron(req: Request) {
  const start = Date.now();
  logger.info("cron", "➜ POST/GET /api/cron/email-digest");

  // 1. Validate Upstash QStash Signature or standard CRON_SECRET auth header
  const signature = req.headers.get("upstash-signature");
  const authHeader = req.headers.get("authorization");

  let isValid = false;

  if (signature && process.env.QSTASH_CURRENT_SIGNING_KEY) {
    // Read raw body clone for QStash verification
    const body = await req.clone().text();
    isValid = await receiver.verify({
      signature,
      body,
    }).catch(() => false);
  } else if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    isValid = true;
  }

  // Developer mode local bypass when keys are not configured
  if (process.env.NODE_ENV === "development" && !process.env.CRON_SECRET) {
    isValid = true;
  }

  if (!isValid) {
    logger.warn("cron", "Unauthorized trigger attempt for email-digest cron route");
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 2. Fetch all organizations
    const allOrgs = await db.select().from(organizations);

    const results = {
      processed: 0,
      emailsSent: 0,
      failed: 0,
    };

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    // 3. Process weekly digest for each organization
    for (const org of allOrgs) {
      results.processed++;
      try {
        // A. Retrieve admins and owners of the tenant
        const orgMembers = await db
          .select({
            userId: members.userId,
            userEmail: users.email,
            userName: users.name,
            role: members.role,
          })
          .from(members)
          .where(eq(members.organizationId, org.id))
          .innerJoin(users, eq(members.userId, users.id));

        const admins = orgMembers.filter(m =>
          m.role === "admin" || m.role === "owner" || m.role === "administrator"
        );

        if (admins.length === 0) {
          logger.info("cron", `Skip email-digest for org ${org.id}: no admins/owners found`);
          continue;
        }

        // B. Generate organizational stats for the last 7 days
        const reportData = await generateOrgReportData(org.id);
        const { metrics, recentLogs } = reportData;

        const successRate = metrics.webhookDeliveriesCount > 0 
          ? ((metrics.webhookSuccessCount / metrics.webhookDeliveriesCount) * 100).toFixed(1)
          : "100";

        // C. Dispatch emails using Resend client
        for (const admin of admins) {
          if (!resend) {
            logger.warn("cron", `Resend client not configured. Skip weekly digest dispatch to ${admin.userEmail}`);
            continue;
          }

          // Build recent activity logs rows
          const logsHtml = recentLogs.slice(0, 5).map(log => `
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 10px 0; font-size: 13px; color: #4a5568;">${new Date(log.createdAt).toLocaleDateString()}</td>
              <td style="padding: 10px 0; font-size: 13px; color: #2d3748;"><strong>${log.userName}</strong></td>
              <td style="padding: 10px 0; font-size: 13px; color: #4a5568;">${log.action}</td>
              <td style="padding: 10px 0; font-size: 13px; color: #718096; font-weight: 500;">${log.entityType}</td>
            </tr>
          `).join("");

          const dashboardLink = `${baseUrl}/org/${org.slug}/settings/activity`;
          const downloadPdfLink = `${baseUrl}/api/org/${org.slug}/reports?format=pdf`;

          await resend.emails.send({
            from: "Weekly Digest <reports@mg.vittis.com.br>",
            to: admin.userEmail,
            subject: `Resumo Semanal: Atividade em ${org.name}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #2d3748; background-color: #f7fafc;">
                <div style="background-color: #1e293b; padding: 24px; border-radius: 8px 8px 0 0; color: #ffffff; text-align: center;">
                  <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.025em;">Resumo Semanal de Atividades</h1>
                  <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.85; font-weight: 500;">Organização: ${org.name}</p>
                </div>

                <div style="padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                  <p style="font-size: 16px; line-height: 1.5; margin-top: 0; font-weight: 500;">Olá, ${admin.userName},</p>
                  <p style="font-size: 14px; line-height: 1.5; color: #4a5568; margin-bottom: 24px;">Abaixo compilamos as métricas principais e o log de atividades operacionais da sua organização <strong>${org.name}</strong> referentes aos últimos 7 dias:</p>

                  <!-- Metrics Table Grid -->
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                    <tr>
                      <td style="width: 32%; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; text-align: center;">
                        <span style="font-size: 10px; color: #718096; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 6px; letter-spacing: 0.05em;">Projetos Ativos</span>
                        <strong style="font-size: 24px; color: #1e293b; display: block; line-height: 1.2;">${metrics.projectsCount}</strong>
                        <span style="font-size: 11px; color: #48bb78; display: block; margin-top: 6px; font-weight: 500;">+${metrics.newProjectsCount} criados</span>
                      </td>
                      <td style="width: 2%;"></td>
                      <td style="width: 32%; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; text-align: center;">
                        <span style="font-size: 10px; color: #718096; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 6px; letter-spacing: 0.05em;">Membros Totais</span>
                        <strong style="font-size: 24px; color: #1e293b; display: block; line-height: 1.2;">${metrics.membersCount}</strong>
                        <span style="font-size: 11px; color: #48bb78; display: block; margin-top: 6px; font-weight: 500;">+${metrics.newMembersCount} novos</span>
                      </td>
                      <td style="width: 2%;"></td>
                      <td style="width: 32%; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; text-align: center;">
                        <span style="font-size: 10px; color: #718096; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 6px; letter-spacing: 0.05em;">Faturamento / WH</span>
                        <strong style="font-size: 24px; color: #1e293b; display: block; line-height: 1.2;">${metrics.webhookDeliveriesCount}</strong>
                        <span style="font-size: 11px; color: #4a5568; display: block; margin-top: 6px; font-weight: 500;">${successRate}% sucesso</span>
                      </td>
                    </tr>
                  </table>

                  <!-- Recent Logs Table -->
                  <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; border-bottom: 2px solid #edf2f7; padding-bottom: 8px; margin-top: 32px; margin-bottom: 12px;">Atividades Administrativas Recentes</h3>
                  ${recentLogs.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse; text-align: left; margin: 12px 0;">
                      <thead>
                        <tr style="border-bottom: 2px solid #e2e8f0;">
                          <th style="padding: 8px 0; font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 0.05em;">Data</th>
                          <th style="padding: 8px 0; font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 0.05em;">Usuário</th>
                          <th style="padding: 8px 0; font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 0.05em;">Ação</th>
                          <th style="padding: 8px 0; font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 0.05em;">Recurso</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${logsHtml}
                      </tbody>
                    </table>
                  ` : `
                    <p style="font-size: 13px; color: #718096; font-style: italic; margin: 16px 0;">Nenhuma alteração operacional ou administrativa registrada nesta semana.</p>
                  `}

                  <!-- Actions Center -->
                  <div style="margin-top: 36px; text-align: center;">
                    <a href="${dashboardLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 4px; margin-right: 8px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">Acessar Painel</a>
                    <a href="${downloadPdfLink}" style="display: inline-block; padding: 12px 24px; background-color: #ffffff; color: #2563eb; border: 1px solid #e2e8f0; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Download Relatório (PDF)</a>
                  </div>
                </div>

                <div style="text-align: center; margin-top: 28px; font-size: 12px; color: #a0aec0; line-height: 1.5;">
                  <p>Você está recebendo este e-mail porque possui o papel de Administrador na organização ${org.name}.</p>
                  <p style="margin-top: 6px;">&copy; ${new Date().getFullYear()} SaaS Multi-tenant. Todos os direitos reservados.</p>
                </div>
              </div>
            `,
          });
          results.emailsSent++;
        }
      } catch (err) {
        logger.error("cron", `Failed compilation for organization ${org.id} in email-digest cron`, err);
        results.failed++;
      }
    }

    const duration = Date.now() - start;
    logger.info("cron", `✓ POST/GET /api/cron/email-digest | 200 | ${duration}ms`);
    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    logger.error("cron", "✗ POST/GET /api/cron/email-digest | Global failure", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
