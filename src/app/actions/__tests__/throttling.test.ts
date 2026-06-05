import { describe, it, expect, vi, beforeEach } from "vitest";
import { getThrottlingStatusAction } from "../throttling";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { withAdminTenantDb } from "@/lib/db/tenant-db";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      organizations: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock("@/lib/db/tenant-db", () => ({
  withAdminTenantDb: vi.fn(),
}));

describe("Throttling Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return default free tier stats if user session is missing", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const result = await getThrottlingStatusAction("org_1");
    expect(result.isThrottled).toBe(false);
    expect(result.reason).toBe("none");
  });

  it("should return free tier limit exceeded warning if organization is on free tier and no anomalies", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user_1" },
    } as any);

    vi.mocked(db.query.organizations.findFirst).mockResolvedValue({
      plan: "free",
    } as any);

    vi.mocked(withAdminTenantDb).mockResolvedValue([]); // No anomalies found

    const result = await getThrottlingStatusAction("org_1");
    expect(result.isThrottled).toBe(true);
    expect(result.reason).toBe("limit_exceeded");
    expect(result.maxRate).toBe(10);
  });

  it("should return security anomaly warning if recent SECURITY_ANOMALY_DETECTED is present in audit logs", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user_1" },
    } as any);

    vi.mocked(db.query.organizations.findFirst).mockResolvedValue({
      plan: "free",
    } as any);

    vi.mocked(withAdminTenantDb).mockResolvedValue([
      { action: "SECURITY_ANOMALY_DETECTED" },
    ]); // Anomaly found

    const result = await getThrottlingStatusAction("org_1");
    expect(result.isThrottled).toBe(true);
    expect(result.reason).toBe("security_anomaly");
  });

  it("should return no throttling if organization is on pro plan and has no anomalies", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user_1" },
    } as any);

    vi.mocked(db.query.organizations.findFirst).mockResolvedValue({
      plan: "pro",
    } as any);

    vi.mocked(withAdminTenantDb).mockResolvedValue([]); // No anomalies

    const result = await getThrottlingStatusAction("org_1");
    expect(result.isThrottled).toBe(false);
    expect(result.reason).toBe("none");
    expect(result.plan).toBe("pro");
  });
});
