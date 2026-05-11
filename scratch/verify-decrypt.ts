import { symmetricDecrypt } from "better-auth/crypto";

async function main() {
  const secret = "test_secret_1234567890_gravity_saas";
  const encrypted = "1c4a59a304285eb499264cbdf519cd33f2a7e9a5421076464e53a8b34e7fdb3ef1a4b1de7977270215d8b2f5b006a41c";
  
  try {
    const decrypted = await symmetricDecrypt({
      data: encrypted,
      key: secret
    });
    console.log("Decrypted:", decrypted);
  } catch (err) {
    console.error("Failed to decrypt:", err);
  }
}

main();
