import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyStateToken, encrypt } from "@/lib/integrations/encryption";
import { exchangeTeamsCode } from "@/lib/integrations/teams";
import { getTenantDb } from "@/lib/db/tenant-db";
import { connectors, workflows } from "@/lib/db/schema";
import { recordAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("Microsoft Teams OAuth authorization error:", error);
    return NextResponse.redirect(new URL("/login?error=teams_auth_failed", request.url));
  }

  if (!code || !state) {
    return new NextResponse("Missing code or state parameters", { status: 400 });
  }

  try {
    // 1. Verify state token
    const { userId, orgId } = verifyStateToken(state);

    // 2. Fetch organization slug
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });

    if (!org) {
      return new NextResponse("Organization not found", { status: 404 });
    }

    // 3. Exchange code for access & refresh tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/connectors/teams/callback`;
    const teamsCredentials = await exchangeTeamsCode(code, redirectUri);

    // 4. Encrypt sensitive tokens
    const encryptedAccessToken = encrypt(teamsCredentials.accessToken);
    const encryptedRefreshToken = encrypt(teamsCredentials.refreshToken);
    const expiresAt = Date.now() + teamsCredentials.expiresIn * 1000;

    // 5. Store connector inside the tenant DB schema
    const connectorId = crypto.randomUUID();
    const configJson = JSON.stringify({
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt,
      flow: "oauth",
    });

    await getTenantDb(userId, orgId, async (tx) => {
      // Insert Teams OAuth connector
      await tx.insert(connectors).values({
        id: connectorId,
        name: "MS Teams (OAuth)",
        type: "teams",
        config: configJson,
        isActive: true,
      });

      // Insert default event workflows
      const defaultEvents = ["project.created", "member.invited", "organization.invitation_accepted"];
      for (const eventId of defaultEvents) {
        await tx.insert(workflows).values({
          id: crypto.randomUUID(),
          name: `Notify MS Teams for ${eventId}`,
          trigger: eventId,
          actionType: "webhook",
          // Graph API flow workflow doesn't need external URL hook (calls MS Graph internally)
          actionConfig: JSON.stringify({ flow: "oauth" }),
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
        details: "Connected Microsoft Teams integration via OAuth",
      });
    } catch (auditErr) {
      console.error("Failed to log audit event:", auditErr);
    }

    // 7. Redirect to settings integrations page
    const targetUrl = new URL(`/org/${org.slug}/settings/integrations`, request.url);
    targetUrl.searchParams.set("success", "teams");
    return NextResponse.redirect(targetUrl);

  } catch (err: unknown) {
    console.error("Microsoft Teams OAuth callback failed:", err);
    return NextResponse.redirect(new URL("/login?error=teams_integration_failed", request.url));
  }
}
