import { Command } from 'commander';
import * as p from '@clack/prompts';
import { db } from '../../lib/db';
import { organizations } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { createTenantSchema } from '../../lib/db/tenant';

export const tenantCommands = new Command('tenant')
  .description('Manage tenant schemas and migrations');

tenantCommands
  .command('list')
  .description('List all organizations and their tenant schemas')
  .action(async () => {
    const s = p.spinner();
    s.start('Fetching tenants...');
    
    try {
      const allOrgs = await db.select().from(organizations);
      s.stop('Tenants fetched successfully');
      
      const tableData = allOrgs.map(org => ({
        name: org.name,
        schema: org.tenantSchemaName || 'N/A',
        id: org.id
      }));

      console.table(tableData);
    } catch (error) {
      s.error('Failed to fetch tenants');
      console.error(error);
    }
  });

tenantCommands
  .command('migrate')
  .description('Run schema creation/update for all tenants')
  .option('-t, --tenant <id>', 'Specific tenant ID to migrate')
  .action(async (options) => {
    const s = p.spinner();
    
    try {
      let orgsToMigrate;
      if (options.tenant) {
        orgsToMigrate = await db.select().from(organizations).where(eq(organizations.id, options.tenant));
      } else {
        orgsToMigrate = await db.select().from(organizations);
      }

      s.start(`Migrating ${orgsToMigrate.length} tenants...`);

      for (const org of orgsToMigrate) {
        if (org.tenantSchemaName) {
          s.message(`Migrating ${org.name}...`);
          await createTenantSchema(org.tenantSchemaName);
        }
      }

      s.stop('✅ Migration complete for all tenants');
    } catch (error) {
      s.error('❌ Migration failed');
      console.error(error);
    }
  });
