import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { withApiTenantDb } from "@/lib/db/api-db";

export async function GET() {
  const headerList = await headers();
  const tenantId = headerList.get("x-tenant-id");
  const tenantSchema = headerList.get("x-tenant-schema");
  const roleId = headerList.get("x-role-id");

  if (!tenantId || !tenantSchema) {
    return NextResponse.json(
      { error: "Authentication context missing. Ensure you are calling this via the API Proxy." },
      { status: 401 }
    );
  }

  try {
    return await withApiTenantDb(tenantSchema, async () => {
      // Diagnostic check: verify search_path is set correctly by querying current_schema()
      // or just trust the transaction wrapper and return the context.
      
      return NextResponse.json({
        tenantId,
        schema: tenantSchema,
        roleId,
        status: "active",
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error("[API v1/me] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
