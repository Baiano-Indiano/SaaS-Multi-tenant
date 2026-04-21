"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { members, invitations, projects, roles, organizations } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { headers } from "next/headers";
import { getTenantDb } from "@/lib/db/tenant-db";
import { PLANS } from "@/lib/billing/plans";

export async function getDashboardStatsAction(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  try {
    // 1. Fetch Organization Plan
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });

    if (!org) throw new Error("Organization not found");

    const currentPlan = PLANS[org.plan.toUpperCase() as keyof typeof PLANS] || PLANS.FREE;

    // 2. Fetch data from PUBLIC schema
    const memberCountResult = await db
      .select({ val: count() })
      .from(members)
      .where(eq(members.organizationId, orgId));
    
    const inviteCountResult = await db
      .select({ val: count() })
      .from(invitations)
      .where(
        and(
          eq(invitations.organizationId, orgId),
          eq(invitations.status, "pending")
        )
      );

    // 2. Fetch data from TENANT schema
    const tenantStats = await getTenantDb(session.user.id, orgId, async (tx) => {
      const projectCountResult = await tx
        .select({ val: count(), status: projects.status })
        .from(projects)
        .groupBy(projects.status);
      
      const roleCountResult = await tx
        .select({ val: count() })
        .from(roles);

      return {
        projects: projectCountResult,
        rolesCount: roleCountResult[0]?.val || 0,
      };
    });

    const totalProjects = tenantStats.projects.reduce((acc, curr) => acc + curr.val, 0);

    return {
      success: true,
      stats: {
        totalMembers: memberCountResult[0]?.val || 0,
        pendingInvites: inviteCountResult[0]?.val || 0,
        totalProjects,
        projectBreakdown: tenantStats.projects,
        totalRoles: tenantStats.rolesCount,
        quotas: {
          maxMembers: currentPlan.maxMembers,
          maxProjects: currentPlan.maxProjects,
        }
      }
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    throw new Error("Failed to load analytics data.");
  }
}
