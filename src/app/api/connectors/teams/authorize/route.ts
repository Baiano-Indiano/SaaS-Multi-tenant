import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateStateToken } from "@/lib/integrations/encryption";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orgSlug = searchParams.get("orgSlug");

  if (!orgSlug) {
    return new NextResponse("Missing organization slug", { status: 400 });
  }

  // Retrieve organization to check access and get ID
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) {
    return new NextResponse("Organization not found", { status: 404 });
  }

  // Generate signed state parameter
  const state = generateStateToken(session.user.id, org.id);
  
  const clientId = process.env.TEAMS_CLIENT_ID;
  if (!clientId) {
    return new NextResponse("Teams client ID not configured", { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/connectors/teams/callback`;
  const scope = "Group.ReadWrite.All ChannelMessage.Send offline_access";

  const teamsAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

  return NextResponse.redirect(teamsAuthUrl);
}
