import postgres from "postgres";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";
import { 
  DEFAULT_ADMIN_PERMISSIONS, 
  DEFAULT_MEMBER_PERMISSIONS 
} from "../lib/auth/permissions";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL!;

async function migrate() {
  console.log("🚀 Starting RBAC Migration...");
  const sql = postgres(connectionString, { prepare: false });

  try {
    // 1. Get all tenant schemas
    const schemas = await sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
    `;

    console.log(`Found ${schemas.length} tenant schemas to migrate.`);

    for (const { schema_name: schema } of schemas) {
      console.log(`\n📦 Migrating schema: ${schema}`);

      // 2. Create Tables inside the schema
      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(schema)}.role (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL,
          description TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS ${sql(schema)}.role_permission (
          "roleId" TEXT NOT NULL REFERENCES ${sql(schema)}.role(id) ON DELETE CASCADE,
          "permissionKey" TEXT NOT NULL,
          PRIMARY KEY ("roleId", "permissionKey")
        );
      `;

      // 3. Create Default Roles
      const existingRoles = await sql`SELECT id FROM ${sql(schema)}.role LIMIT 1`;
      
      let adminRoleId: string;
      let memberRoleId: string;

      if (existingRoles.length === 0) {
        adminRoleId = randomUUID();
        memberRoleId = randomUUID();

        console.log(`Creating default roles for ${schema}...`);

        await sql`
          INSERT INTO ${sql(schema)}.role (id, name, slug, description)
          VALUES (${adminRoleId}, 'Administrator', 'administrator', 'Full access to all organization resources')
        `;

        for (const p of DEFAULT_ADMIN_PERMISSIONS) {
          await sql`
            INSERT INTO ${sql(schema)}.role_permission ("roleId", "permissionKey")
            VALUES (${adminRoleId}, ${p})
          `;
        }

        await sql`
          INSERT INTO ${sql(schema)}.role (id, name, slug, description)
          VALUES (${memberRoleId}, 'Member', 'member', 'Standard access to organization resources')
        `;

        for (const p of DEFAULT_MEMBER_PERMISSIONS) {
          await sql`
            INSERT INTO ${sql(schema)}.role_permission ("roleId", "permissionKey")
            VALUES (${memberRoleId}, ${p})
          `;
        }
      } else {
        // Fetch existing roles if they were already created partially
        const adminRole = await sql`SELECT id FROM ${sql(schema)}.role WHERE slug = 'administrator'`;
        const memberRole = await sql`SELECT id FROM ${sql(schema)}.role WHERE slug = 'member'`;
        adminRoleId = adminRole[0]?.id;
        memberRoleId = memberRole[0]?.id;
      }

      // 4. Update Members in Public Schema to link to these roles
      // We need to find the organization associated with this schema
      const org = await sql`SELECT id FROM public.organization WHERE "tenantSchemaName" = ${schema}`;
      
      if (org.length > 0) {
        const organizationId = org[0].id;
        
        console.log(`Updating members for organization ${organizationId}...`);

        // Case A: Admins/Owners -> Administrator
        const adminUpdate = await sql`
          UPDATE public.member 
          SET "roleId" = ${adminRoleId}
          WHERE "organizationId" = ${organizationId} 
          AND (role = 'admin' OR role = 'owner')
          AND "roleId" IS NULL
        `;
        console.log(`Updated ${adminUpdate.count} administrators.`);

        // Case B: Members -> Member
        const memberUpdate = await sql`
          UPDATE public.member 
          SET "roleId" = ${memberRoleId}
          WHERE "organizationId" = ${organizationId} 
          AND role = 'member'
          AND "roleId" IS NULL
        `;
        console.log(`Updated ${memberUpdate.count} members.`);
      }
    }

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("\n❌ Migration failed:");
    console.error(error);
  } finally {
    await sql.end();
  }
}

migrate();
