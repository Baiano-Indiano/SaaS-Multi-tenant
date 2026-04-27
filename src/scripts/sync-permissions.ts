
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./src/lib/db";
import { organizations } from "./src/lib/db/schema";
import postgres from "postgres";
import { 
  DEFAULT_ADMIN_PERMISSIONS, 
  DEFAULT_MEMBER_PERMISSIONS, 
  DEFAULT_VIEWER_PERMISSIONS 
} from "./src/lib/auth/permissions";

const connectionString = process.env.DATABASE_URL!;

async function sync() {
  console.log("🚀 Starting permission synchronization...");
  
  try {
    const allOrgs = await db.select().from(organizations);
    console.log(`Found ${allOrgs.length} organizations.`);

    const client = postgres(connectionString, { prepare: false });

    for (const org of allOrgs) {
      if (!org.tenantSchemaName) {
        console.log(`⚠️ Skipping organization ${org.name} (no schema defined)`);
        continue;
      }
      
      const schema = org.tenantSchemaName;
      console.log(`\n📦 Syncing schema: ${schema} (${org.name})`);

      try {
        // Get roles for this tenant
        const roles = await client.unsafe(`SELECT id, slug FROM "${schema}".role`);
        
        for (const role of roles) {
          let targetPerms: string[] = [];
          if (role.slug === 'admin') targetPerms = [...DEFAULT_ADMIN_PERMISSIONS];
          else if (role.slug === 'member') targetPerms = [...DEFAULT_MEMBER_PERMISSIONS];
          else if (role.slug === 'viewer') targetPerms = [...DEFAULT_VIEWER_PERMISSIONS];

          if (targetPerms.length === 0) {
            console.log(`  - Skipping role: ${role.slug}`);
            continue;
          }

          console.log(`  - Updating role "${role.slug}" with ${targetPerms.length} permissions...`);

          // Clear existing permissions to avoid stale entries
          await client.unsafe(`DELETE FROM "${schema}".role_permission WHERE "roleId" = $1`, [role.id]);

          // Bulk insert new permissions
          for (const perm of targetPerms) {
            await client.unsafe(
              `INSERT INTO "${schema}".role_permission ("roleId", "permissionKey") 
               VALUES ($1, $2) 
               ON CONFLICT DO NOTHING`, 
              [role.id, perm]
            );
          }
        }
        console.log(`✅ Finished syncing ${schema}`);
      } catch (err) {
        console.error(`❌ Failed to sync schema ${schema}:`, err);
      }
    }

    await client.end();
    console.log("\n✨ Permission synchronization complete!");
  } catch (error) {
    console.error("Critical error during sync:", error);
  }
  
  process.exit(0);
}

sync();
