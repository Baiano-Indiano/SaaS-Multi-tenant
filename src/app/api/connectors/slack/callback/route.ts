import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTenantDb, withAdminTenantDb } from "@/lib/db/tenant-db";
import { connectors, workflows } from "@/lib/db/schema";
import { encrypt } from "@/lib/security/crypto";
import { recordAuditLog } from "@/lib/audit";

interface SlackOauthResponse {
  ok: boolean;
  error?: string;
  access_token?: string;
  team?: {
    id: string;
    name: string;
  };
  incoming_webhook?: {
    channel: string;
    channel_id: string;
    configuration_url: string;
    url: string;
  };
}

export async function GET(req: NextRequest) {
  const _start = Date.now();
  logger.info('api', '➜ GET /api/connectors/slack/callback');
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "Missing OAuth code or state parameter" }, { status: 400 });
  }

  const stateKey = `slack_oauth_state:${state}`;

  try {
    // 1. Verify state parameter from Redis
    const stateData = await redis.get<{ userId: string; orgId: string; orgSlug: string }>(stateKey);

    if (!stateData) {
      return NextResponse.json({ error: "Invalid or expired state parameter. Please try again." }, { status: 400 });
    }

    const { userId, orgId, orgSlug } = stateData;

    // Delete state from Redis (one-time use)
    await redis.del(stateKey);

    if (!env.SLACK_CLIENT_ID || !env.SLACK_CLIENT_SECRET) {
      return NextResponse.json({ error: "Slack credentials are not configured on this server." }, { status: 500 });
    }

    // 2. Exchange code for Slack Access Token
    const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/connectors/slack/callback`;
    const params = new URLSearchParams({
      client_id: env.SLACK_CLIENT_ID,
      client_secret: env.SLACK_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const slackData = (await response.json()) as SlackOauthResponse;

    if (!slackData.ok || !slackData.incoming_webhook || !slackData.team || !slackData.access_token) {
      logger.error('api', `✗ GET /api/connectors/slack/callback | OAuth exchange failed: ${slackData.error}`);
      return NextResponse.json(
        { error: `Slack OAuth exchange failed: ${slackData.error || "Missing token or webhook info"}` },
        { status: 400 }
      );
    }

    const { incoming_webhook, team, access_token } = slackData;

    // Encrypt the access token
    const encryptedAccessToken = encrypt(access_token);

    // Save the connector and auto-subscribe default workflows in the tenant database
    const connectorId = crypto.randomUUID();
    const config = JSON.stringify({
      url: incoming_webhook.url,
      channel: incoming_webhook.channel,
      teamName: team.name,
      teamId: team.id,
      accessToken: encryptedAccessToken,
    });

    // Run db queries with admin tenant DB since OAuth completes out of request middleware context
    await withAdminTenantDb(orgId, async (tx) => {
      // 3. Insert new connector
      await tx.insert(connectors).values({
        id: connectorId,
        name: `Slack (${team.name} - ${incoming_webhook.channel})`,
        type: "slack",
        config,
        isActive: true,
      });

      // 4. Auto-subscribe default workflows (Notify Slack on project created, member invited, etc.)
      const defaultEvents = ["project.created", "member.invited", "organization.invitation_accepted"];
      for (const eventId of defaultEvents) {
        await tx.insert(workflows).values({
          id: crypto.randomUUID(),
          name: `Notify Slack for ${eventId}`,
          trigger: eventId,
          actionType: "webhook",
          actionConfig: JSON.stringify({ url: incoming_webhook.url }),
          connectorId: connectorId,
          isActive: true,
        });
      }
    });

    // 5. Fetch user record for audit logs
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    // 6. Record Audit Log
    if (userRecord) {
      await recordAuditLog({
        organizationId: orgId,
        action: "CONNECTOR_CREATED",
        entityType: "CONNECTOR",
        entityId: connectorId,
        details: `Connected Slack app to workspace "${team.name}" (channel: ${incoming_webhook.channel})`,
        actor: {
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
        },
      });
    }

    // 7. Redirect back to integrations page
    logger.info('api', `✓ GET /api/connectors/slack/callback | 302 | ${Date.now() - _start}ms`);
    return NextResponse.redirect(`${env.NEXT_PUBLIC_APP_URL}/org/${orgSlug}/settings/integrations?success=slack`);
  } catch (error) {
    logger.error('api', '✗ GET /api/connectors/slack/callback | Error during callback processing', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
