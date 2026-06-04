"use server";

import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { withAdminTenantDb } from "@/lib/db/tenant-db";
import { auditLogs } from "@/lib/db/schema";
import { desc, and, gte } from "drizzle-orm";

export interface ThrottlingStatus {
  isThrottled: boolean;
  reason: "limit_exceeded" | "security_anomaly" | "none";
  plan: string;
  maxRate: number;
}

export async function getThrottlingStatusAction(orgId: string): Promise<ThrottlingStatus> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { isThrottled: false, reason: "none", plan: "free", maxRate: 10 };
    }

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: { plan: true },
    });

    if (!org) {
      return { isThrottled: false, reason: "none", plan: "free", maxRate: 10 };
    }

    // SCIM/Free Tier throttling logic check:
    // Only organizations on "free" plan are throttled at 10 req/s.
    const isFree = org.plan === "free";
    
    // Check if there was a SECURITY_ANOMALY_DETECTED in the last 24 hours
    let hasAnomaly = false;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      const recentLogs = await withAdminTenantDb(orgId, async (tx) => {
        return tx
          .select({ action: auditLogs.action })
          .from(auditLogs)
          .where(
            and(
              eq(auditLogs.action, "SECURITY_ANOMALY_DETECTED"),
              gte(auditLogs.createdAt, oneDayAgo)
            )
          )
          .orderBy(desc(auditLogs.createdAt))
          .limit(1);
      });
      hasAnomaly = recentLogs.length > 0;
    } catch (e) {
      // If tenant DB is not fully ready or populated yet
      console.warn("[Throttling Action] Failed to query audit logs:", e);
    }

    if (isFree && hasAnomaly) {
      return {
        isThrottled: true,
        reason: "security_anomaly",
        plan: "free",
        maxRate: 10,
      };
    }

    // Check if they are nearing rate limit (utilization mock or checking recent logs/redis if needed)
    // For this boilerplate, if they are on "free", we display warning banner when active anomaly or high load is simulated/active.
    return {
      isThrottled: isFree,
      reason: isFree ? "limit_exceeded" : "none",
      plan: org.plan,
      maxRate: isFree ? 10 : org.plan === "starter" ? 50 : 100,
    };
  } catch (err) {
    console.error("[Throttling Action] Error:", err);
    return { isThrottled: false, reason: "none", plan: "free", maxRate: 10 };
  }
}
