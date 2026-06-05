import { describe, it, expect, vi, beforeEach } from "vitest";
import { runSequentialMigrations } from "../migration-orchestrator";
import { GET as migrationsCron } from "@/app/api/cron/migrations-worker/route";
import { db } from "../index";
import { createTenantSchema } from "../tenant";

// Mock dependencies
vi.mock("../index", () => {
  const mockDb = {
    select: vi.fn().mockImplementation(() => {
      const chain: any = {};
      chain.from = vi.fn().mockResolvedValue([
        { id: "org_1", name: "Org 1", tenantSchemaName: "tenant_1" },
        { id: "org_2", name: "Org 2", tenantSchemaName: null },
        { id: "org_3", name: "Org 3", tenantSchemaName: "tenant_3" },
      ]);
      return chain;
    }),
  };
  return { db: mockDb };
});

vi.mock("../tenant", () => ({
  createTenantSchema: vi.fn().mockResolvedValue({ adminRoleId: "admin-role" }),
}));

vi.mock("../../logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("Sequential Migrations Orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "secret-token";
  });

  describe("runSequentialMigrations()", () => {
    it("should process schemas sequentially in batches and skip tenants without schemas", async () => {
      const result = await runSequentialMigrations(2);
      
      expect(db.select).toHaveBeenCalled();
      expect(createTenantSchema).toHaveBeenCalledTimes(2);
      expect(createTenantSchema).toHaveBeenCalledWith("tenant_1");
      expect(createTenantSchema).toHaveBeenCalledWith("tenant_3");

      expect(result.total).toBe(3);
      expect(result.processed).toBe(2);
      expect(result.results.find(r => r.orgId === "org_2")?.status).toBe("skipped");
      expect(result.results.find(r => r.orgId === "org_1")?.status).toBe("success");
    });

    it("should gracefully capture schema migration errors without breaking the runner", async () => {
      vi.mocked(createTenantSchema).mockRejectedValueOnce(new Error("Database connection lock"));

      const result = await runSequentialMigrations(1);

      expect(createTenantSchema).toHaveBeenCalledTimes(2);
      expect(result.processed).toBe(2);
      
      const failedResult = result.results.find(r => r.orgId === "org_1");
      expect(failedResult?.status).toBe("failed");
      expect(failedResult?.error).toBe("Database connection lock");

      const successResult = result.results.find(r => r.orgId === "org_3");
      expect(successResult?.status).toBe("success");
    });
  });

  describe("Migrations Worker API Route", () => {
    it("should return 401 if request is unauthorized", async () => {
      const request = new Request("http://localhost/api/cron/migrations-worker", {
        headers: { authorization: "Bearer invalid" },
      });
      const response = await migrationsCron(request);
      expect(response.status).toBe(401);
    });

    it("should execute migrations and return 200 on success", async () => {
      const request = new Request("http://localhost/api/cron/migrations-worker", {
        headers: { authorization: "Bearer secret-token" },
      });
      const response = await migrationsCron(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.processed).toBe(2);
      expect(json.total).toBe(3);
    });
  });
});
