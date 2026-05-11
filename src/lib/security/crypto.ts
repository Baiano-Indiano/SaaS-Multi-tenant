import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

/**
 * Utility for encrypting and decrypting sensitive strings (like API keys) at rest.
 * Uses AES-256-GCM for authenticated encryption with per-record random salt.
 * 
 * Ciphertext format: iv:salt:authTag:encryptedData (all hex-encoded)
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

// FAIL-CLOSED: No fallback key. App will not start without a valid key.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  // In production this is fatal. In dev/test, we allow a generated key with a loud warning.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: ENCRYPTION_KEY is missing or invalid (must be a 64-char hex string). ' +
      'Cannot start the application with insecure encryption.'
    );
  } else {
    console.warn(
      '⚠️  ENCRYPTION_KEY is missing or invalid. Using a random ephemeral key. ' +
      'Encrypted data will NOT survive restarts. Set ENCRYPTION_KEY in .env for persistence.'
    );
  }
}

// Derive a stable fallback only for dev — production always has the real key (enforced above)
const EFFECTIVE_KEY = ENCRYPTION_KEY || randomBytes(32).toString('hex');

/**
 * Encrypts a string and returns it in the format `iv:salt:authTag:encryptedText`
 * Each encryption uses a unique random salt for key derivation.
 */
export function encrypt(text: string): string {
  if (!text) return '';
  
  const iv = randomBytes(IV_LENGTH);
  const salt = randomBytes(SALT_LENGTH);
  const key = scryptSync(EFFECTIVE_KEY, salt, 32);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${salt.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string that was encrypted using the `encrypt` function above.
 * Supports both legacy format (iv:authTag:encrypted with static salt) and
 * new format (iv:salt:authTag:encrypted with per-record salt).
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  if (!encryptedText.includes(':')) {
    return encryptedText;
  }

  try {
    const parts = encryptedText.split(':');
    
    let iv: Buffer, salt: Buffer, authTag: Buffer, encrypted: string;

    if (parts.length === 4) {
      // New format: iv:salt:authTag:encrypted
      iv = Buffer.from(parts[0], 'hex');
      salt = Buffer.from(parts[1], 'hex');
      authTag = Buffer.from(parts[2], 'hex');
      encrypted = parts[3];
    } else if (parts.length === 3) {
      // Legacy format: iv:authTag:encrypted (static salt)
      iv = Buffer.from(parts[0], 'hex');
      salt = Buffer.from('saas-salt');
      authTag = Buffer.from(parts[1], 'hex');
      encrypted = parts[2];
    } else {
      return encryptedText;
    }

    const key = scryptSync(EFFECTIVE_KEY, salt, 32);
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch {
    console.error('Decryption failed — key may have rotated or data is corrupted.');
    // SECURITY: Do not return the ciphertext. Return empty to signal failure.
    return '';
  }
}

