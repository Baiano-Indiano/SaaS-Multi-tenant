interface TeamsExchangeResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Exchanges the Microsoft Teams authorization code for access and refresh tokens.
 */
export async function exchangeTeamsCode(code: string, redirectUri: string): Promise<TeamsExchangeResult> {
  const clientId = process.env.TEAMS_CLIENT_ID;
  const clientSecret = process.env.TEAMS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Microsoft Teams client ID or client secret not configured");
  }

  const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to exchange Microsoft Teams code: ${errText}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error("No access token returned from Microsoft Teams OAuth");
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || "",
    expiresIn: data.expires_in || 3600,
  };
}
