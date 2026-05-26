import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateOrgReportData, generatePdfReport } from "../generator";
import { db } from "../../db/index";
import { withAdminTenantDb } from "../../db/tenant-db";

import { projects, members, webhooks, webhookDeliveries, auditLogs } from "../../db/schema";

// Mock the main database module
vi.mock("../../db/index", () => ({
  db: {
    query: {
      organizations: {
        findFirst: vi.fn(),
      },
    },
    transaction: vi.fn(),
  },
}));

// Mock the tenant isolation wrapper
vi.mock("../../db/tenant-db", () => ({
  withAdminTenantDb: vi.fn(),
}));

describe("Report Generator (generator.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateOrgReportData()", () => {
    it("should fetch metrics and logs and return expected schema", async () => {
      // 1. Mock the organization check
      vi.mocked(db.query.organizations.findFirst).mockResolvedValue({
        id: "org-123",
        name: "Acme Corp",
        slug: "acme-corp",
        plan: "enterprise",
        createdAt: new Date(),
        tenantSchemaName: "tenant_org_123",
        require2FA: false,
        domainVerified: false,
        logo: null,
        metadata: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        customDomain: null,
        verificationToken: null,
      });

      // 2. Mock Drizzle queries for specific tables inside transaction context
      vi.mocked(withAdminTenantDb).mockImplementation(async (orgId: string, cb: any) => {
        const tx = {
          select: vi.fn().mockImplementation((fields?: any) => {
            return {
              from: vi.fn().mockImplementation((table) => {
                let mockResult: any[] = [];
                if (table === projects) {
                  mockResult = [
                    { id: "p1", name: "Alpha", createdAt: new Date() },
                    { id: "p2", name: "Beta", createdAt: new Date() },
                  ];
                } else if (table === members) {
                  mockResult = [
                    { id: "m1", userId: "u1", organizationId: "org-123", role: "admin", createdAt: new Date() },
                  ];
                } else if (table === webhooks) {
                  mockResult = [
                    { id: "w1", url: "https://hook.io", secret: "sec", isActive: true, createdAt: new Date() },
                  ];
                } else if (table === webhookDeliveries) {
                  mockResult = [
                    { id: "d1", status: "delivered", createdAt: new Date(), eventType: "project.created", payload: "{}" },
                    { id: "d2", status: "failed", createdAt: new Date(), eventType: "project.created", payload: "{}" },
                  ];
                } else if (table === auditLogs) {
                  mockResult = [
                    {
                      id: "l1",
                      userName: "Alice",
                      userEmail: "alice@acme.com",
                      action: "PROJECT_CREATED",
                      entityType: "PROJECT",
                      createdAt: new Date(),
                    },
                  ];
                }

                const queryChain = {
                  where: vi.fn().mockReturnThis(),
                  orderBy: vi.fn().mockReturnThis(),
                  limit: vi.fn().mockResolvedValue(mockResult),
                  then: (resolve: any) => resolve(mockResult),
                  catch: () => {},
                };

                return Object.assign(Promise.resolve(mockResult), queryChain);
              }),
            };
          }),
        };
        return await cb(tx);
      });

      const reportData = await generateOrgReportData("org-123");

      expect(reportData.orgName).toBe("Acme Corp");
      expect(reportData.orgSlug).toBe("acme-corp");
      expect(reportData.plan).toBe("enterprise");
      expect(reportData.metrics.projectsCount).toBe(2);
      expect(reportData.metrics.membersCount).toBe(1);
      expect(reportData.metrics.webhooksCount).toBe(1);
      expect(reportData.metrics.webhookDeliveriesCount).toBe(2);
      expect(reportData.metrics.webhookSuccessCount).toBe(1);
      expect(reportData.metrics.webhookFailedCount).toBe(1);
      expect(reportData.recentLogs).toHaveLength(1);
      expect(reportData.recentLogs[0].userName).toBe("Alice");
    });
  });

  describe("generatePdfReport()", () => {
    it("should generate a PDF buffer with layout details", () => {
      const mockData = {
        orgName: "Acme Corp",
        orgSlug: "acme-corp",
        plan: "enterprise",
        metrics: {
          projectsCount: 2,
          newProjectsCount: 1,
          membersCount: 1,
          newMembersCount: 0,
          webhooksCount: 1,
          webhookDeliveriesCount: 2,
          webhookSuccessCount: 1,
          webhookFailedCount: 1,
        },
        recentLogs: [
          {
            id: "l1",
            userName: "Alice",
            userEmail: "alice@acme.com",
            action: "PROJECT_CREATED",
            entityType: "PROJECT",
            createdAt: new Date(),
          },
        ],
      };

      const pdfBuffer = generatePdfReport("Acme Corp", mockData);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });
});
