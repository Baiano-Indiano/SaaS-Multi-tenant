import { db } from "../lib/db";
import { users, accounts, organizations, members, twoFactors } from "../lib/db/schema";
import { createTenantSchema } from "../lib/db/tenant";
import { symmetricEncrypt, hashPassword } from "better-auth/crypto";

async function main() {
	console.log("🌱 Starting test data seeding...");
	console.log("DATABASE_URL:", process.env.DATABASE_URL);

	const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || "static-test-secret-for-ci-deterministic-logic";
	const ADMIN_EMAIL = "test_admin@example.com";
	const PASSWORD = "password123";

	// 1. Setup User
	const userId = "test-admin-uuid";
	
	// Pre-encrypted backup codes
	const backupCodes = ["12345-67890", "54321-09876"];
	const encryptedBackupCodes = await symmetricEncrypt({
		key: BETTER_AUTH_SECRET,
		data: JSON.stringify(backupCodes),
	});

	console.log(`- Creating user: ${ADMIN_EMAIL}`);
	await db.insert(users).values({
		id: userId,
		name: "Test Administrator",
		email: ADMIN_EMAIL,
		emailVerified: true,
		twoFactorEnabled: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	}).onConflictDoUpdate({
		target: users.id,
		set: {
			twoFactorEnabled: true,
			updatedAt: new Date(),
		}
	});

	// 1.1 Setup 2FA record
	console.log("- Setting up 2FA record for admin");
	const totpSecret = "JBSWY3DPEHPK3PXP"; // "Hello world" in base32
	await db.insert(twoFactors).values({
		id: "test-admin-2fa-id",
		userId: userId,
		secret: totpSecret,
		backupCodes: encryptedBackupCodes,
		verified: true
	}).onConflictDoUpdate({
		target: twoFactors.id,
		set: {
			secret: totpSecret,
			backupCodes: encryptedBackupCodes,
			verified: true
		}
	});

	// 2. Setup Password Account
	const hashedPassword = await hashPassword(PASSWORD);
	console.log(`- Setting up credentials for user`);
	await db.insert(accounts).values({
		id: "test-admin-account-uuid",
		userId: userId,
		accountId: userId,
		providerId: "credential",
		password: hashedPassword,
		createdAt: new Date(),
		updatedAt: new Date(),
	}).onConflictDoUpdate({
		target: accounts.id,
		set: {
			password: hashedPassword,
			updatedAt: new Date(),
		}
	});

	// 3. Create Organizations
	const orgs = [
		{ id: "org-acme-id", name: "Acme Corp", slug: "acme-corp", schema: "tenant_acme_corp" },
		{ id: "org-globex-id", name: "Globex Corp", slug: "globex-corp", schema: "tenant_globex_corp" },
	];

	for (const org of orgs) {
		console.log(`- Provisioning organization: ${org.name} (${org.slug})`);
		await db.insert(organizations).values({
			id: org.id,
			name: org.name,
			slug: org.slug,
			tenantSchemaName: org.schema,
			createdAt: new Date(),
			require2FA: org.slug === "acme-corp", // Enforce 2FA on Acme
		}).onConflictDoUpdate({
			target: organizations.id,
			set: {
				tenantSchemaName: org.schema,
				require2FA: org.slug === "acme-corp",
			}
		});

		console.log(`  - Creating member link`);
		await db.insert(members).values({
			id: `member-${org.id}-${userId}`,
			organizationId: org.id,
			userId: userId,
			role: "admin",
			createdAt: new Date(),
		}).onConflictDoNothing();

		console.log(`  - Initializing tenant schema: ${org.schema}`);
		await createTenantSchema(org.schema);
	}

	console.log("✅ Seeding completed successfully!");
	process.exit(0);
}

main().catch((err) => {
	console.error("❌ Seeding failed:", err);
	process.exit(1);
});
