import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/v1/me/route";
import { headers } from "next/headers";
import { db } from "@/lib/db";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

// Mock db
vi.mock("@/lib/db", () => ({
  db: {
    transaction: vi.fn((cb) => cb({
      execute: vi.fn(),
    })),
  },
}));

describe("API v1 /me endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if tenant context is missing", async () => {
    const mockHeaders = new Headers();
    vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Authentication context missing");
  });

  it("should return success when headers are correctly injected by proxy", async () => {
    const mockHeaders = new Headers();
    mockHeaders.set("x-tenant-id", "org_123");
    mockHeaders.set("x-tenant-schema", "tenant_acme_corp");
    mockHeaders.set("x-role-id", "admin");
    vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.tenantId).toBe("org_123");
    expect(data.data.schema).toBe("tenant_acme_corp");
    expect(data.data.roleId).toBe("admin");
  });

  it("should return 500 if transaction fails", async () => {
    const mockHeaders = new Headers();
    mockHeaders.set("x-tenant-id", "org_123");
    mockHeaders.set("x-tenant-schema", "tenant_acme_corp");
    vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>);

    vi.mocked(db.transaction).mockRejectedValue(new Error("DB Connection Error"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Internal Server Error");
  });
});
