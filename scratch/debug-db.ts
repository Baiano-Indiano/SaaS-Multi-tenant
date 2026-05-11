import { db } from "../src/lib/db";
import * as schema from "../src/lib/db/schema";


async function debugAuth() {
    console.log("--- DEBUG AUTH ---");
    const users = await db.select().from(schema.users);
    console.log("Users in DB:", users.map(u => ({ id: u.id, email: u.email, mfa: (u as { twoFactorEnabled?: boolean }).twoFactorEnabled })));

    const twoFactors = await db.select().from(schema.twoFactors);
    console.log("2FA Records in DB:", twoFactors);
}

debugAuth().catch(console.error);
