import { headers } from "next/headers";
import { withApiTenantDb, apiError, apiSuccess } from "@/lib/db/api-db";
import { logger } from "@/lib/logger";

export async function GET() {
  const _start = Date.now();
  logger.info('api', '➜ GET /api/v1/me');
  const headerList = await headers();
  const tenantId = headerList.get("x-tenant-id");
  const tenantSchema = headerList.get("x-tenant-schema");
  const roleId = headerList.get("x-role-id");

  if (!tenantId || !tenantSchema) {
    return apiError("Authentication context missing. Ensure you are calling this via the API Proxy.", 401);
  }

  try {
    return await withApiTenantDb(tenantSchema, async () => {
      logger.info('api', `✓ GET /api/v1/me | 200 | ${Date.now() - _start}ms`);
      return apiSuccess({
        tenantId,
        schema: tenantSchema,
        roleId,
        status: "active",
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    logger.error('api', '✗ GET /api/v1/me | Internal Server Error', error);
    return apiError("Internal Server Error", 500, error instanceof Error ? error.message : String(error));
  }
}
