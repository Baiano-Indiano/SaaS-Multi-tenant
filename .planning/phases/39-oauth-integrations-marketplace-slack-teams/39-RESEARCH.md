# Phase 39: OAuth Integrations & Marketplace (Slack/Teams) - Research

**Researched:** 2026-05-26
**Domain:** External Connectors & OAuth integrations
**Confidence:** HIGH

<user_constraints>
## User Constraints

### Locked Decisions
- **D-01 (OAuth Security):** Callback state token will be a signed JWT containing `userId` and `organizationId` to prevent CSRF.
- **D-02 (Token Encryption):** Credential fields will be encrypted in Node.js using AES-256-GCM and the `CONNECTOR_SECRET` key.
- **D-03 (Teams Integration):** Support both MS Graph Client OAuth connection flow and fallback custom incoming webhook URLs.
- **D-04 (Marketplace UI):** Add `/org/[orgSlug]/settings/integrations` sub-route with connector cards and overlays.

### the agent's Discretion
- Choice of icons and layout transitions for card hover states.

### Deferred Ideas (OUT OF SCOPE)
- Conditional filtering workflow triggers (Phase 40).
- Scheduled PDF/JSON telemetry digests and cron job configurations (Phase 41).

</user_constraints>

<research_summary>
## Summary

This research outlines the implementation specifications for the Slack and Microsoft Teams integration marketplace in Phase 39. To connect to Slack, we will implement a standard OAuth 2.0 handshake using `@slack/web-api`, requesting bot permissions (`chat:write`, `incoming-webhook`). To connect to Microsoft Teams, we will support both a Graph API OIDC authorization flow (via Microsoft Graph Client) and a direct webhook URL fallback.

To maintain strict tenant isolation (Rule 2), all integration keys and configuration payloads are saved in the `connector` table located inside the tenant-specific Postgres schema. The tokens are encrypted at rest using AES-256-GCM.

</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@slack/web-api` | 7.x | Slack integrations | Official Slack SDK for Web API operations |
| `@microsoft/microsoft-graph-client` | 3.x | Microsoft Teams integrations | Official Graph API client for MS Teams connectivity |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jsonwebtoken` | 9.x | State token signing | Signing and verifying the `state` parameter in redirects |
| `crypto` | Native | AES encryption | Native cryptographical library for GCM encryption |

**Installation:**
```bash
npm install @slack/web-api @microsoft/microsoft-graph-client jsonwebtoken
npm install -D @types/jsonwebtoken
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── api/
│       └── connectors/
│           ├── slack/
│           │   ├── authorize/route.ts   # Redirects to Slack
│           │   └── callback/route.ts    # Slack OAuth callback handler
│           └── teams/
│               ├── authorize/route.ts   # Redirects to Microsoft
│               └── callback/route.ts    # Teams callback handler
└── lib/
    ├── integrations/
    │   ├── encryption.ts                # AES-256-GCM encrypt/decrypt
    │   ├── slack.ts                     # Slack api calls & OAuth logic
    │   └── teams.ts                     # Teams Microsoft Graph api calls
    └── db/
        └── schema.ts                    # Reference to tenant-specific connector schema
```

### Pattern 1: Signed JWT OAuth State
```typescript
import jwt from "jsonwebtoken";

const STATE_SECRET = process.env.CONNECTOR_SECRET || "fallback-secret";

export function generateStateToken(userId: string, orgId: string): string {
  return jwt.sign({ userId, orgId }, STATE_SECRET, { expiresIn: "15m" });
}

export function verifyStateToken(token: string): { userId: string; orgId: string } {
  return jwt.verify(token, STATE_SECRET) as { userId: string; orgId: string };
}
```

### Pattern 2: AES-256-GCM Node.js Encryption
```typescript
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = crypto.scryptSync(process.env.CONNECTOR_SECRET || "default", "salt", 32);

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
```

### Anti-Patterns to Avoid
- **Leaking OAuth Credentials:** Storing client secrets in client components. Ensure they are kept server-side only.
- **Unencrypted Tokens:** Storing raw access tokens in database dumps. Always encrypt using AES.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token Cryptography | Custom XOR or plain base64 | `crypto` AES-256-GCM | Security compliance and authenticated encryption verification |
| State Verification | Simple random number mapping | Signed JWT | Avoids state storage lookup bottlenecks and secures parameters |

</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Callback State Tampering
- **What goes wrong:** Attackers intercept/tamper redirect parameters to complete installation on arbitrary workspaces.
- **How to avoid:** Validate signed JWT states on callback, verifying `orgId` matches current active workspace.

### Pitfall 2: Token Expiration on Graph API
- **What goes wrong:** Teams tokens expire in 60 minutes causing connection breaks.
- **How to avoid:** Implement MS Graph refresh token rotation using `offline_access` scope.

</common_pitfalls>

<code_examples>
## Code Examples

### Slack Token Exchange
```typescript
import { WebClient } from "@slack/web-api";

export async function exchangeSlackCode(code: string, redirectUri: string) {
  const client = new WebClient();
  const response = await client.oauth.v2.access({
    client_id: process.env.SLACK_CLIENT_ID!,
    client_secret: process.env.SLACK_CLIENT_SECRET!,
    code,
    redirect_uri: redirectUri,
  });
  return response;
}
```
</code_examples>

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Plain Webhooks | OAuth 2.0 apps | More control over granular scopes and tokens |
| Stateful OAuth sessions | Signed JWT states | Fully stateless, edge-compatible flow |

</sota_updates>

<validation_architecture>
## Validation Architecture

### Automated Tests
- Mock OAuth REST API requests during testing to prevent hitting live Slack/Microsoft servers.
- Verify JWT state signature verification fail cases.
- Test encryption/decryption cycles for null, empty, and special characters.

### Manual Verification
- Install Slack connector on local dev workspace using `ngrok` tunnel mapping callback routes.
- Confirm connection status toggles successfully in the `/settings/integrations` UI.

</validation_architecture>

<sources>
- Slack App Directory Integration docs
- Microsoft Entra ID App Registrations guide
</sources>

<metadata>
- Research scope: Slack OAuth and Microsoft Teams OIDC integration
- Confidence: HIGH
- Research date: 2026-05-26
</metadata>

---
*Phase: 39-oauth-integrations-marketplace-slack-teams*
*Research completed: 2026-05-26*
*Ready for planning: yes*
