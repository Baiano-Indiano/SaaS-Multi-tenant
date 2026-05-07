import { symmetricEncrypt } from "better-auth/crypto";

async function main() {
  const secret = "test_secret_1234567890_gravity_saas";
  const backupCodes = ["12345-67890"];
  const json = JSON.stringify(backupCodes);
  
  const encrypted = await symmetricEncrypt({
    data: json,
    key: secret
  });
  
  console.log(encrypted);
}

main();
