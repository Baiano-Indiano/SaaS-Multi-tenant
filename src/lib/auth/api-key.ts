const KEY_PREFIX = "sk_live_";

/**
 * Generates a new random API key.
 * Format: sk_live_[32 random hex chars]
 */
export function generateApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `${KEY_PREFIX}${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Hashes a raw API key using SHA-256 (Edge compatible).
 */
export async function hashApiKey(key: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Extracts the displayable prefix of a key (e.g., sk_live_abcd...).
 */
export function getApiKeyDisplayPrefix(key: string): string {
  // sk_live_ + 4 chars
  return key.substring(0, 12);
}

/**
 * Validates a raw key against a stored hash.
 */
export async function validateApiKey(rawKey: string, storedHash: string): Promise<boolean> {
  const hashed = await hashApiKey(rawKey);
  return hashed === storedHash;
}
