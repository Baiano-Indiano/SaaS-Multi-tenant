import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyStateToken, encrypt } from "@/lib/integrations/encryption";
import { exchangeSlackCode } from "@/lib/integrations/slack";
import { getTenantDb } from "@/lib/db/tenant-db";
import { connectors, workflows } from "@/lib/db/schema";
import { recordAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("Slack OAuth authorization error:", error);
    return NextResponse.redirect(new URL("/login?error=slack_auth_failed", request.url));
  }

  if (!code || !state) {
    return new NextResponse("Missing code or state parameters", { status: 400 });
  }

  try {
    // 1. Verify state token (JWT containing userId and orgId)
    const { userId, orgId } = verifyStateToken(state);

    // 2. Fetch organization slug for redirect path
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });

    if (!org) {
      return new NextResponse("Organization not found", { status: 404 });
    }

    // 3. Exchange Slack code for credentials
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/connectors/slack/callback`;
    const slackCredentials = await exchangeSlackCode(code, redirectUri);

    // 4. Encrypt sensitive credentials
    const encryptedAccessToken = encrypt(slackCredentials.accessToken);

    // 5. Store connector and default workflows in tenant-specific database schema
    const connectorId = crypto.randomUUID();
    const configJson = JSON.stringify({
      accessToken: encryptedAccessToken,
      url: slackCredentials.webhookUrl,
      channel: slackCredentials.channel,
      teamName: slackCredentials.teamName,
      botUserId: slackCredentials.botUserId,
    });

    await getTenantDb(userId, orgId, async (tx) => {
      // Insert Slack connector
      await tx.insert(connectors).values({
        id: connectorId,
        name: slackCredentials.teamName ? `${slackCredentials.teamName} Slack` : "Slack Integration",
        type: "slack",
        config: configJson,
        isActive: true,
      });

      // Insert default event workflows
      const defaultEvents = ["project.created", "member.invited", "organization.invitation_accepted"];
      for (const eventId of defaultEvents) {
        await tx.insert(workflows).values({
          id: crypto.randomUUID(),
          name: `Notify slack for ${eventId}`,
          trigger: eventId,
          actionType: "webhook",
          actionConfig: JSON.stringify({ url: slackCredentials.webhookUrl }),
          connectorId: connectorId,
          isActive: true,
        });
      }
    });

    // 6. Record Audit Log
    try {
      await recordAuditLog({
        organizationId: orgId,
        action: "CONNECTOR_CREATED",
        entityType: "CONNECTOR",
        entityId: connectorId,
        details: `Connected Slack integration "${slackCredentials.teamName}"`,
      });
    } catch (auditErr) {
      console.error("Failed to log audit event:", auditErr);
    }

    // 7. Redirect to settings integrations page with success query
    const targetUrl = new URL(`/org/${org.slug}/settings/integrations`, request.url);
    targetUrl.searchParams.set("success", "slack");
    return NextResponse.redirect(targetUrl);

  } catch (err: unknown) {
    console.error("Slack OAuth callback failed:", err);
    return NextResponse.redirect(new URL("/login?error=slack_integration_failed", request.url));
  }
}
