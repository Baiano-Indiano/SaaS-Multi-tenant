import crypto from "crypto";

/**
 * Generates an HMAC-SHA256 signature for a webhook payload.
 * Matches the format expected by our v1 webhook consumers.
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

/**
 * Verifies an HMAC-SHA256 signature for a webhook payload.
 * Used by consumers to validate that the request came from us.
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  
  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}
