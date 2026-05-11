import { encrypt, decrypt } from '@/lib/security/crypto';

async function testEncryption() {
  const testData = "super-secret-api-key-12345";
  console.log("Original Data:", testData);

  try {
    const encrypted = encrypt(testData);
    console.log("Encrypted:", encrypted);

    const decrypted = decrypt(encrypted);
    console.log("Decrypted:", decrypted);

    if (testData === decrypted) {
      console.log("✅ Encryption/Decryption test PASSED!");
    } else {
      console.error("❌ Encryption/Decryption test FAILED! Data mismatch.");
    }
  } catch (error) {
    console.error("❌ Encryption/Decryption test FAILED with error:", error);
  }
}

testEncryption();
