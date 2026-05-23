# Phase 39: OAuth Integrations & Marketplace (Slack) - Implementation Plan

Introduce a first-class Slack OAuth 2.0 flow to replace manual webhook URL copy-pasting for organization integrations. This improves the developer/user experience and increases security.

## User Review Required

> [!IMPORTANT]
> The Slack OAuth flow requires registering a Slack App and configuring environment variables (`SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`).
> For local testing, a tunneling service (e.g., ngrok or Localtunnel) is required because Slack OAuth callback redirects must be accessible over HTTPS.
> We will use the existing Upstash Redis instance to store short-lived state parameters to prevent CSRF attacks.

## Open Questions

> [!NOTE]
> Are you planning to register a Slack App on your developer account now, or would you like to set up mock handlers first to verify the flow locally before registering the credentials?

## Proposed Changes

---

### Environment & Configuration

#### [MODIFY] [env.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/lib/env.ts)
- Add `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` as optional schema fields.

---

### Backend API Routes (OAuth Handshake)

#### [NEW] [route.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/api/connectors/slack/authorize/route.ts)
- Verify the active user session and organization context.
- Generate a cryptographically secure random `state` string.
- Map the state to `{ userId, orgId, orgSlug }` and store it in Redis with a 5-minute expiration (TTL 300s).
- Redirect the user to:
  `https://slack.com/oauth/v2/authorize?client_id=${env.SLACK_CLIENT_ID}&scope=incoming-webhook&redirect_uri=${env.NEXT_PUBLIC_APP_URL}/api/connectors/slack/callback&state=${state}`

#### [NEW] [route.ts](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/api/connectors/slack/callback/route.ts)
- Receive `code` and `state` parameters from Slack redirect.
- Fetch the state data from Redis. If missing or invalid, return a 400 Bad Request (prevent CSRF).
- Exchange the code for an access token by POSTing to `https://slack.com/api/oauth.v2.access` with Client ID, Secret, and Redirect URI.
- Parse the response:
  - `incoming_webhook`: `{ url: string, channel: string, ... }`
  - `team`: `{ name: string, id: string }`
  - `access_token`
- Encrypt the access token using the AES-256-GCM encryption system (`src/lib/security/crypto.ts`).
- Query the tenant database:
  - Create a new record in the `connectors` table with:
    - `name`: `Slack (${team.name} - ${incoming_webhook.channel})`
    - `type`: `slack`
    - `config`: `{ url: incoming_webhook.url, accessToken, teamName, teamId, channel }`
  - Insert default workflows for `project.created`, `member.invited`, and `organization.invitation_accepted` mapped to the new connector.
- Delete the state key from Redis.
- Redirect the user back to `/org/${orgSlug}/settings/integrations?success=slack` with a toast trigger.

---

### Frontend UI Integrations

#### [MODIFY] [integrations/page.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/app/(main)/[locale]/(app)/org/[orgSlug]/settings/integrations/page.tsx)
- Check for `?success=slack` in query params and trigger a success toast.
- Make the Slack Available Integration card active by providing a "Connect Slack" button that points to the authorize endpoint.

#### [MODIFY] [connector-list.tsx](file:///c:/Users/Bernardo/Desktop/SaaS%20Multi-tenant/src/components/settings/integrations/connector-list.tsx)
- Hide the raw webhook URL for OAuth-managed connectors, displaying only the Slack Workspace and Channel Name.

---

## Verification Plan

### Automated Tests
- Create Vitest mock tests for callback state validation, token exchange endpoint, and connector/workflow database insertion.

### Manual Verification
1. Click the "Connect Slack" button inside the Settings page.
2. Verify redirection to Slack OAuth portal with the correct scopes (`incoming-webhook`).
3. Complete authorization and verify redirect back to the app with a success toast.
4. Verify that the connector is added to the "Active Connections" list.
5. Trigger a mock system event (e.g. create a project) and verify the rich Slack message arrives in the designated channel.
