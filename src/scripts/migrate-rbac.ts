import postgres from "postgres";
import { randomUUID } from "crypto";
import { 
  ROLE_PERMISSIONS_MAP
} from "../lib/auth/permissions";

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
      console.log(`\n💎 Migrating schema: ${schema}`);

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

      // 3. Create Default Roles if they don't exist
      for (const [slug, permissions] of Object.entries(ROLE_PERMISSIONS_MAP)) {
        const existingRole = await sql`SELECT id FROM ${sql(schema)}.role WHERE slug = ${slug}`;
        
        let roleId: string;
        if (existingRole.length === 0) {
          roleId = randomUUID();
          const name = slug.charAt(0).toUpperCase() + slug.slice(1);
          console.log(`  - Creating role: ${name} (${slug})`);
          
          await sql`
            INSERT INTO ${sql(schema)}.role (id, name, slug, description)
            VALUES (${roleId}, ${name}, ${slug}, ${`Standard ${name} role`})
          `;
        } else {
          roleId = existingRole[0].id;
          console.log(`  - Role ${slug} already exists, syncing permissions...`);
        }

        // Sync permissions (idempotent)
        await sql`DELETE FROM ${sql(schema)}.role_permission WHERE "roleId" = ${roleId}`;
        if (permissions.length > 0) {
          const values = permissions.map(p => ({ roleId, permissionKey: p }));
          await sql`INSERT INTO ${sql(schema)}.role_permission ${sql(values)}`;
        }
      }

      // 4. Update Members in Public Schema to link to these roles
      const org = await sql`SELECT id FROM public.organization WHERE "tenantSchemaName" = ${schema}`;
      
      if (org.length > 0) {
        const organizationId = org[0].id;
        
        for (const slug of Object.keys(ROLE_PERMISSIONS_MAP)) {
          const role = await sql`SELECT id FROM ${sql(schema)}.role WHERE slug = ${slug}`;
          if (role.length > 0) {
            const roleId = role[0].id;
            
            // Map old string roles to new UUID roles
            // admin/owner -> admin role
            const roleFilter = slug === 'admin' ? "('admin', 'owner')" : `('${slug}')`;
            
            const updateCount = await sql`
              UPDATE public.member 
              SET "roleId" = ${roleId}
              WHERE "organizationId" = ${organizationId} 
              AND role IN ${sql.unsafe(roleFilter)}
              AND "roleId" IS NULL
            `;
            if (updateCount.count > 0) {
              console.log(`  - Linked ${updateCount.count} members to ${slug} role.`);
            }
          }
        }
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
