import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../../../app/api/cron/email-digest/route";
import { db } from "../../db/index";
import { resend } from "../../mail";
import { generateOrgReportData } from "../generator";

// Mock database connection
vi.mock("../../db/index", () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock mail module (spies on emails.send)
vi.mock("../../mail", () => ({
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
}));

// Mock report data generator
vi.mock("../generator", () => ({
  generateOrgReportData: vi.fn(),
}));

describe("Weekly Email Digest Cron Job", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      CRON_SECRET: "test-cron-secret",
      RESEND_API_KEY: "re_testkey",
    };
  });

  it("should reject trigger with 401 when auth headers are invalid", async () => {
    const req = new Request("http://localhost:3000/api/cron/email-digest", {
      method: "GET",
      headers: {
        authorization: "Bearer wrong-secret",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(db.select).not.toHaveBeenCalled();
  });

  it("should process organizations and dispatch emails when secret is correct", async () => {
    // 1. Mock the sequential database selects
    let selectCallCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      selectCallCount++;
      const currentCall = selectCallCount;
      return {
        from: vi.fn().mockImplementation(() => {
          return {
            where: vi.fn().mockImplementation(() => {
              return {
                innerJoin: vi.fn().mockResolvedValue([
                  {
                    userId: "user-1",
                    userEmail: "admin@testorg.com",
                    userName: "Admin User",
                    role: "owner",
                  },
                ]),
              };
            }),
            // Handle first call returning all organizations
            then: (resolve: any) => {
              if (currentCall === 1) {
                return resolve([
                  {
                    id: "org-1",
                    name: "Test Org",
                    slug: "test-org",
                    plan: "free",
                    createdAt: new Date(),
                  },
                ]);
              }
              return resolve([]);
            },
          };
        }),
      } as any;
    });

    // 2. Mock report data generation
    vi.mocked(generateOrgReportData).mockResolvedValue({
      orgName: "Test Org",
      orgSlug: "test-org",
      plan: "free",
      metrics: {
        projectsCount: 3,
        newProjectsCount: 1,
        membersCount: 2,
        newMembersCount: 0,
        webhooksCount: 1,
        webhookDeliveriesCount: 5,
        webhookSuccessCount: 4,
        webhookFailedCount: 1,
      },
      recentLogs: [
        {
          id: "log-1",
          userName: "Admin User",
          userEmail: "admin@testorg.com",
          action: "PROJECT_CREATED",
          entityType: "PROJECT",
          createdAt: new Date(),
        },
      ],
    });

    // 3. Mock the email dispatch spy
    vi.mocked(resend!.emails.send).mockResolvedValue({ id: "email-123" } as any);

    const req = new Request("http://localhost:3000/api/cron/email-digest", {
      method: "GET",
      headers: {
        authorization: "Bearer test-cron-secret",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.processed).toBe(1);
    expect(json.emailsSent).toBe(1);
    expect(json.failed).toBe(0);

    // Verify correct functions were invoked
    expect(generateOrgReportData).toHaveBeenCalledWith("org-1");
    expect(resend!.emails.send).toHaveBeenCalled();
  });
});
