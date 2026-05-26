import { describe, it, expect } from "vitest";
import { encrypt, decrypt, generateStateToken, verifyStateToken } from "../encryption";

describe("Encryption Utilities", () => {
  it("should encrypt and decrypt a text correctly", () => {
    const originalText = "super-secret-slack-token-123456";
    const encrypted = encrypt(originalText);
    
    expect(encrypted).not.toBe(originalText);
    expect(encrypted).toContain(":"); // Should contain IV and Auth Tag separators
    
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it("should fail to decrypt if the payload format is invalid", () => {
    expect(() => decrypt("invalidformat")).toThrow("Invalid encrypted text format");
  });

  it("should fail to decrypt if the token has been tampered with", () => {
    const originalText = "my-secret-token";
    const encrypted = encrypt(originalText);
    const parts = encrypted.split(":");
    
    // Tamper with the ciphertext (the last part)
    parts[2] = parts[2].substring(0, parts[2].length - 2) + "00";
    const tampered = parts.join(":");
    
    expect(() => decrypt(tampered)).toThrow();
  });
});

describe("State JWT Utilities", () => {
  it("should generate and verify a state token correctly", () => {
    const userId = "user_abc123";
    const orgId = "org_xyz789";
    
    const token = generateStateToken(userId, orgId);
    expect(token).toBeDefined();
    
    const decoded = verifyStateToken(token);
    expect(decoded.userId).toBe(userId);
    expect(decoded.orgId).toBe(orgId);
  });

  it("should throw an error for an invalid state token", () => {
    expect(() => verifyStateToken("invalid.token.here")).toThrow("Invalid state token");
  });
});
