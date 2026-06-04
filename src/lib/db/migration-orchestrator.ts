import { db } from "./index";
import { organizations } from "./schema";
import { createTenantSchema } from "./tenant";
import { logger } from "../logger";

export interface MigrationResult {
  orgId: string;
  orgName: string;
  schema: string;
  status: "success" | "failed" | "skipped";
  error?: string;
}

/**
 * Sequentially migrates all tenant schemas in batches.
 * Avoids resource lockups and connection pool exhaustion.
 */
export async function runSequentialMigrations(batchSize = 10): Promise<{
  total: number;
  processed: number;
  results: MigrationResult[];
}> {
  logger.info("migration", "🚀 Starting sequential tenant schema migration batch...");
  
  const allOrgs = await db.select({
    id: organizations.id,
    name: organizations.name,
    tenantSchemaName: organizations.tenantSchemaName
  }).from(organizations);

  const results: MigrationResult[] = [];
  let processedCount = 0;

  // Process in sequential chunks
  for (let i = 0; i < allOrgs.length; i += batchSize) {
    const chunk = allOrgs.slice(i, i + batchSize);
    
    // Process the chunk concurrently, but sequential relative to other chunks
    await Promise.all(chunk.map(async (org) => {
      if (!org.tenantSchemaName) {
        results.push({
          orgId: org.id,
          orgName: org.name,
          schema: "",
          status: "skipped"
        });
        return;
      }

      processedCount++;
      try {
        logger.info("migration", `Migrating schema for ${org.name} (${org.tenantSchemaName})...`);
        await createTenantSchema(org.tenantSchemaName);
        results.push({
          orgId: org.id,
          orgName: org.name,
          schema: org.tenantSchemaName,
          status: "success"
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("migration", `❌ Failed migration for ${org.name}:`, error);
        results.push({
          orgId: org.id,
          orgName: org.name,
          schema: org.tenantSchemaName,
          status: "failed",
          error: errorMessage
        });
      }
    }));
  }

  logger.info("migration", `🏁 Sequential migration complete. Processed ${processedCount}/${allOrgs.length} orgs.`);
  return {
    total: allOrgs.length,
    processed: processedCount,
    results
  };
}
