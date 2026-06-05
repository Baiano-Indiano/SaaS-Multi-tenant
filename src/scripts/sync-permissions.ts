
import dotenv from "dotenv";
import path from "path";
import postgres from "postgres";

// Load environment variables from .env.local (dev) or .env (prod)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

async function sync() {
  const { db } = await import("../lib/db");
  const { organizations } = await import("../lib/db/schema");
  const { ROLE_PERMISSIONS_MAP } = await import("../lib/auth/permissions");
  const { eq } = await import("drizzle-orm");

  const connectionString = process.env.DATABASE_URL!;
  
  const specificOrgSlug = process.argv[2];
  
  console.log("🚀 Starting permission synchronization...");
  if (specificOrgSlug) {
    console.log(`🎯 Targeting organization: ${specificOrgSlug}`);
  }
  
  const client = postgres(connectionString, { prepare: false });

  try {
    const query = db.select().from(organizations);
    if (specificOrgSlug) {
      query.where(eq(organizations.slug, specificOrgSlug));
    }
    
    const allOrgs = await query;
    
    if (allOrgs.length === 0) {
      console.log("⚠️ No organizations found matching criteria.");
      return;
    }

    console.log(`Found ${allOrgs.length} organizations to process.`);

    for (const org of allOrgs) {
      const schema = org.tenantSchemaName;
      if (!schema) {
        console.log(`⚠️ Skipping organization ${org.name} (no schema defined)`);
        continue;
      }
      
      console.log(`\n💎 Syncing schema: ${schema} (${org.name})`);

      try {
        // 1. Check if schema exists
        const [schemaExists] = await client`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.schemata 
            WHERE schema_name = ${schema}
          )
        `;

        if (!schemaExists.exists) {
          console.log(`  ❌ Schema "${schema}" does not exist in database. Skipping.`);
          continue;
        }

        // 2. Check if required tables exist in the schema
        const [tablesExist] = await client`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = ${schema} AND table_name = 'role'
          ) AND EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = ${schema} AND table_name = 'role_permission'
          ) as exists
        `;

        if (!tablesExist.exists) {
          console.log(`  ❌ Required tables (role/role_permission) missing in schema "${schema}". Skipping.`);
          continue;
        }

        // 3. Fetch roles for this tenant
        const roles = await client.unsafe(`SELECT id, slug FROM "${schema}".role`);
        
        if (roles.length === 0) {
          console.log(`  ⚠️ No roles found in schema "${schema}".`);
          continue;
        }

        // 4. Transactional update per organization
        await client.begin(async (sql) => {
          for (const role of roles) {
            const targetPerms = Reflect.get(ROLE_PERMISSIONS_MAP, role.slug) as string[] | undefined;

            if (!targetPerms) {
              console.log(`  - Role "${role.slug}" has no default permissions mapping. Skipping.`);
              continue;
            }

            // Remove existing permissions for this role
            await sql`DELETE FROM ${sql(`${schema}.role_permission`)} WHERE "roleId" = ${role.id}`;
            
            // Insert new permissions
            if (targetPerms.length > 0) {
              const values = targetPerms.map(perm => ({
                roleId: role.id,
                permissionKey: perm
              }));
              
              await sql`INSERT INTO ${sql(`${schema}.role_permission`)} ${sql(values)}`;
              console.log(`  ✅ Synced role "${role.slug}" (${targetPerms.length} permissions)`);
            } else {
              console.log(`  ℹ️ Role "${role.slug}" reset to 0 permissions.`);
            }
          }
        });

        console.log(`✨ Successfully synced all permissions for ${org.name}`);
      } catch (err) {
        console.error(`❌ Failed to sync schema "${schema}":`, (err as Error).message);
      }
    }

    console.log("\n✨ Permission synchronization complete!");
  } catch (error) {
    console.error("Critical error during sync:", error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

sync();
