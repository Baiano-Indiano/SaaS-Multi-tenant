import { describe, it, expect } from "vitest";
import { generateWebhookSignature, verifyWebhookSignature } from "@/lib/webhooks";

describe("Webhook Signatures", () => {
  const secret = "whsec_test_secret_123456789";
  const payload = JSON.stringify({
    event: "member.joined",
    data: {
      userId: "user_123",
      email: "test@example.com",
    },
  });

  it("should generate a consistent HMAC-SHA256 signature", () => {
    const sig1 = generateWebhookSignature(payload, secret);
    const sig2 = generateWebhookSignature(payload, secret);
    
    expect(sig1).toBe(sig2);
    expect(sig1).toHaveLength(64); // SHA256 hex is 64 chars
  });

  it("should verify a valid signature", () => {
    const signature = generateWebhookSignature(payload, secret);
    const isValid = verifyWebhookSignature(payload, signature, secret);
    
    expect(isValid).toBe(true);
  });

  it("should reject an invalid signature", () => {
    const isValid = verifyWebhookSignature(payload, "invalid_signature", secret);
    expect(isValid).toBe(false);
  });

  it("should reject a signature generated with a different secret", () => {
    const signature = generateWebhookSignature(payload, "different_secret");
    const isValid = verifyWebhookSignature(payload, signature, secret);
    expect(isValid).toBe(false);
  });

  it("should reject a signature if the payload was tampered with", () => {
    const signature = generateWebhookSignature(payload, secret);
    const tamperedPayload = payload.replace("user_123", "user_666");
    const isValid = verifyWebhookSignature(tamperedPayload, signature, secret);
    expect(isValid).toBe(false);
  });
});
