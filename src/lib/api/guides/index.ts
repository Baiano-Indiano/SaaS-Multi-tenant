export const AUTH_GUIDE = `
# Authentication

All API requests must include a Bearer token in the \`Authorization\` header.

\`\`\`bash
Authorization: Bearer <your_api_key>
\`\`\`

You can generate API keys in the **Security** tab of your dashboard. We recommend using separate keys for development and production environments.

### Key Types
- **Secret Keys**: Used for server-to-server communication. Never expose these in client-side code.
- **Test Keys**: Temporary keys with a short expiration time, ideal for testing in the playground.
`;

export const WEBHOOKS_GUIDE = `
# Webhooks

Webhooks allow you to receive real-time notifications when events occur in your account.

### Security
To ensure that a webhook payload was sent by us and not a malicious third party, we sign every payload with an HMAC-SHA256 signature.

The signature is included in the \`x-hub-signature-256\` header.

### Verification Example (Node.js)
\`\`\`javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
\`\`\`
`;

export const RATE_LIMITING_GUIDE = `
# Rate Limiting

The API implements rate limiting to ensure platform stability and fair usage.

### Limits
- **Free Tier**: 100 requests per minute.
- **Pro Tier**: 1,000 requests per minute.
- **Enterprise Tier**: Custom limits.

### Headers
Every response includes headers to help you track your current usage:
- \`x-ratelimit-limit\`: Maximum requests allowed per window.
- \`x-ratelimit-remaining\`: Remaining requests in the current window.
- \`x-ratelimit-reset\`: Time when the limit resets (Unix timestamp).
`;

export const ALL_GUIDES = [
  {
    id: "auth",
    title: "Authentication",
    content: AUTH_GUIDE,
  },
  {
    id: "webhooks",
    title: "Webhooks",
    content: WEBHOOKS_GUIDE,
  },
  {
    id: "rate-limiting",
    title: "Rate Limiting",
    content: RATE_LIMITING_GUIDE,
  },
];
