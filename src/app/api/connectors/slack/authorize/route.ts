import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import { redis } from "@/lib/redis";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.session?.activeOrganizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.session.activeOrganizationId;
    const userId = session.user.id;

    // Resolve orgSlug (passed via query parameters to authorize, or we fallback if needed)
    const orgSlug = req.nextUrl.searchParams.get("orgSlug");
    if (!orgSlug) {
      return NextResponse.json({ error: "Missing orgSlug query parameter" }, { status: 400 });
    }

    // Verify client configuration
    if (!env.SLACK_CLIENT_ID) {
      return NextResponse.json(
        { error: "Slack integration is not configured on this server (SLACK_CLIENT_ID missing)." },
        { status: 500 }
      );
    }

    // Generate random state parameter
    const state = randomBytes(32).toString("hex");

    // Store state in Redis with 5 min TTL
    const stateKey = `slack_oauth_state:${state}`;
    await redis.set(
      stateKey,
      { userId, orgId, orgSlug },
      { ex: 300 } // 5 minutes expiration
    );

    const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/connectors/slack/callback`;
    const slackUrl = new URL("https://slack.com/oauth/v2/authorize");
    slackUrl.searchParams.set("client_id", env.SLACK_CLIENT_ID);
    slackUrl.searchParams.set("scope", "incoming-webhook");
    slackUrl.searchParams.set("redirect_uri", redirectUri);
    slackUrl.searchParams.set("state", state);

    return NextResponse.redirect(slackUrl.toString());
  } catch (error) {
    console.error("[Slack Authorize] Error initializing OAuth flow:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
