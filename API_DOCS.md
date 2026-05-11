# Webhook Security Guide

All webhooks sent by the platform include a cryptographic signature in the `X-Hub-Signature-256` header. This allows you to verify that the request originated from us and was not tampered with during transit.

## Verification Process

We use **HMAC-SHA256** signatures. To verify a webhook, you must have your webhook secret (found in the connectivity settings for each webhook endpoint).

### 1. Extract the Signature

Read the value of the `X-Hub-Signature-256` header from the incoming request.

### 2. Compute the Signature

Compute an HMAC-SHA256 hash using:

- **Secret**: Your endpoint's signing secret.
- **Payload**: The raw UTF-8 string of the request body (the entire JSON payload).

### 3. Compare Signatures

Compare the signature from the header with your computed signature using a "constant-time comparison" function to prevent timing attacks.

## Example (Node.js)

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// Usage in an Express route:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body); // Use raw body if possible
  const secret = process.env.WEBHOOK_SECRET;

  if (verifyWebhook(payload, signature, secret)) {
    res.status(200).send('Verified');
  } else {
    res.status(401).send('Invalid Signature');
  }
});
```

## Security Best Practices

1. **Always use HTTPS**: Never use unencrypted HTTP for webhook delivery.
2. **Replay Protection**: While we sign the entire payload, you should also verify the `timestamp` field (if present) to prevent replay attacks.
3. **Secret Rotation**: Rotate your secrets periodically or if you suspect they have been compromised.
