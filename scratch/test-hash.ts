import { hashPassword } from "better-auth/crypto";

async function run() {
    const hashed = await hashPassword("password123");
    console.log(hashed);
}

run();
