import { db } from "./index";
import { sql } from "drizzle-orm";
import type { TenantTransaction } from "./tenant-db";

const SAFE_SCHEMA_REGEX = /^tenant_[a-zA-Z0-9_]+$/;

/**
 * withApiTenantDb
 * 
 * Helper for API v1 routes that have already been validated by the Proxy Middleware.
 * It trusts the x-tenant-schema header injected by the proxy.
 * 
 * @param tenantSchema - Injected by proxy middleware (src/proxy.ts)
 * @param callback - Logic to execute within the isolated schema context.
 */
export async function withApiTenantDb<T>(
  tenantSchema: string,
  callback: (tx: TenantTransaction) => Promise<T>
): Promise<T> {
  if (!tenantSchema || !SAFE_SCHEMA_REGEX.test(tenantSchema)) {
    throw new Error("Invalid or missing tenant schema in API request headers.");
  }

  /**
   * We use a transaction to ensure that the 'SET search_path' only affects 
   * the current connection for the duration of the query callback.
   */
  return await db.transaction(async (tx) => {
    // Inject schema context
    await tx.execute(sql.raw(`SET search_path TO "${tenantSchema}", public`));
    
    // Execute the business logic
    return await callback(tx);
  });
}
