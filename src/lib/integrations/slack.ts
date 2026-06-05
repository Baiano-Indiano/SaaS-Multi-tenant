import { WebClient } from "@slack/web-api";

interface SlackExchangeResult {
  accessToken: string;
  webhookUrl: string;
  channel: string;
  teamName: string;
  botUserId?: string;
}

/**
 * Exchanges the Slack authorization code for access tokens.
 */
export async function exchangeSlackCode(code: string, redirectUri: string): Promise<SlackExchangeResult> {
  const client = new WebClient();
  const response = await client.oauth.v2.access({
    client_id: process.env.SLACK_CLIENT_ID!,
    client_secret: process.env.SLACK_CLIENT_SECRET!,
    code,
    redirect_uri: redirectUri,
  });

  if (!response.ok) {
    throw new Error(response.error || "Failed to exchange Slack OAuth code");
  }

  const accessToken = response.access_token;
  const webhookUrl = response.incoming_webhook?.url;
  const channel = response.incoming_webhook?.channel;
  const teamName = response.team?.name;

  if (!accessToken || !webhookUrl) {
    throw new Error("Missing access token or webhook URL in Slack response");
  }

  return {
    accessToken,
    webhookUrl,
    channel: channel || "",
    teamName: teamName || "",
    botUserId: response.bot_user_id,
  };
}
