import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

import { cleanupAuditLogs } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  
  // Protect with CRON_SECRET from environment
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // We need to run cleanup for ALL organizations
    const allOrgs = await db.select().from(organizations);

    const results = [];
    for (const org of allOrgs) {
      if (!org.tenantSchemaName) continue;

      try {
        // We use withAdminTenantDb logic or similar to switch schema
        // Actually recordAuditLog uses getTenantDb(userId, orgId, callback)
        // For a cron job, we might need a system-level schema switcher.
        // Let's create a utility for that or use getTenantDb with a dummy system user.
        
        // For now, let's assume we can use a helper that doesn't check user membership
        // since this is a system-level CRON.
        
        // I'll use the raw connection to switch search_path
        await db.transaction(async (tx) => {
          await tx.execute(`SET search_path TO ${org.tenantSchemaName}`);
          await cleanupAuditLogs(tx);
        });
        
        results.push({ orgId: org.id, status: "success" });
      } catch (err) {
        console.error(`Failed cleanup for org ${org.id}:`, err);
        results.push({ orgId: org.id, status: "error" });
      }
    }

    return NextResponse.json({ 
      processed: allOrgs.length,
      results 
    });
  } catch (error) {
    console.error("Cron Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
