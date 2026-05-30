import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateDataRetentionAction } from "../security";
import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/rbac-utils";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { l1Cache } from "@/lib/cache/l1-cache";
import { recordAuditLog } from "@/lib/audit";
import { withAdminTenantDb } from "@/lib/db/tenant-db";
import { GET as cleanupLogsCron } from "@/app/api/cron/cleanup-logs/route";

// Mock dependencies
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

vi.mock("@/lib/auth/rbac-utils", () => ({
  can: vi.fn(),
}));

vi.mock("@/lib/db", () => {
  const mockDb = {
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ id: "1" }]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    query: {
      organizations: {
        findFirst: vi.fn(),
      },
    },
  };
  return { db: mockDb };
});

vi.mock("@/lib/redis", () => ({
  redis: {
    set: vi.fn().mockResolvedValue("OK"),
  },
}));

vi.mock("@/lib/cache/l1-cache", () => ({
  l1Cache: {
    set: vi.fn(),
  },
}));

vi.mock("@/lib/audit", () => ({
  recordAuditLog: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/db/tenant-db", () => ({
  withAdminTenantDb: vi.fn(async (orgId, callback) => {
    const mockTx = {
      delete: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: "log_1" }, { id: "log_2" }]),
    };
    return callback(mockTx);
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(undefined),
  securityActionRateLimit: {},
}));

describe("Data Retention & Cleanup Sweep Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "super-secret-cron-token";
  });

  describe("updateDataRetentionAction()", () => {
    const orgId = "org_123456";

    it("should fail if user session is expired or not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const result = await updateDataRetentionAction(orgId, true, 30);

      expect(result).toEqual({
        success: false,
        error: "Sessão expirada. Faça login novamente.",
      });
    });

    it("should fail if user lacks security:manage permission", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user_789" },
      } as any);
      vi.mocked(can).mockResolvedValue(false);

      const result = await updateDataRetentionAction(orgId, true, 30);

      expect(result).toEqual({
        success: false,
        error: "Você não tem permissão para gerenciar a segurança desta organização.",
      });
      expect(can).toHaveBeenCalledWith("user_789", orgId, "security:manage");
    });

    it("should fail validation if enabled is true but days is less than 7", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user_789" },
      } as any);
      vi.mocked(can).mockResolvedValue(true);

      const result = await updateDataRetentionAction(orgId, true, 5);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Falha ao atualizar configuração");
    });

    it("should update database and write-through cache if input is valid", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user_789" },
      } as any);
      vi.mocked(can).mockResolvedValue(true);
      
      // Mock db findFirst to return organization
      vi.mocked(db.query.organizations.findFirst).mockResolvedValue({
        id: orgId,
        slug: "my-org",
        require2FA: true,
        plan: "enterprise",
      } as any);

      const result = await updateDataRetentionAction(orgId, true, 45);

      expect(result.success).toBe(true);
      expect(db.update).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalledWith(`org:${orgId}`, {
        require2FA: true,
        id: orgId,
        plan: "enterprise",
      });
      expect(l1Cache.set).toHaveBeenCalledWith(`org:${orgId}`, {
        require2FA: true,
        id: orgId,
        plan: "enterprise",
      });
      expect(recordAuditLog).toHaveBeenCalledWith({
        organizationId: orgId,
        action: "DATA_RETENTION_UPDATED",
        entityType: "ORGANIZATION",
        entityId: orgId,
        details: "Atualizou a política de retenção de dados para 45 dias.",
      });
    });

    it("should allow disabling retention policies by setting days to null", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user_789" },
      } as any);
      vi.mocked(can).mockResolvedValue(true);
      
      vi.mocked(db.query.organizations.findFirst).mockResolvedValue({
        id: orgId,
        slug: "my-org",
        require2FA: false,
        plan: "free",
      } as any);

      const result = await updateDataRetentionAction(orgId, false, null);

      expect(result.success).toBe(true);
      expect(db.update).toHaveBeenCalled();
      expect(recordAuditLog).toHaveBeenCalledWith({
        organizationId: orgId,
        action: "DATA_RETENTION_DISABLED",
        entityType: "ORGANIZATION",
        entityId: orgId,
        details: "Desativou a política de retenção de dados (retenção indefinita).",
      });
    });
  });

  describe("API Cleanup Logs Cron Job", () => {
    it("should return 401 if CRON_SECRET is not provided or incorrect", async () => {
      const request = new Request("http://localhost/api/cron/cleanup-logs", {
        headers: {
          authorization: "Bearer wrong-secret",
        },
      });

      const response = await cleanupLogsCron(request);
      expect(response.status).toBe(401);
    });

    it("should execute cleanup successfully for active retention configurations", async () => {
      const request = new Request("http://localhost/api/cron/cleanup-logs", {
        headers: {
          authorization: "Bearer super-secret-cron-token",
        },
      });

      // Mock list of organizations returned by query
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: "org_abc",
              slug: "abc",
              tenantSchemaName: "tenant_abc",
              dataRetentionDays: 14,
            },
          ]),
        }),
      } as any);

      const response = await cleanupLogsCron(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.message).toBe("Log cleanup cron job completed");
      expect(json.processed).toBe(1);
      expect(json.cleared).toBe(1);
      expect(json.failed).toBe(0);

      // Verify tenantDB administrative connection and delete run
      expect(withAdminTenantDb).toHaveBeenCalledWith("org_abc", expect.any(Function));
      expect(recordAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: "org_abc",
        action: "AUDIT_LOGS_PURGED",
        details: expect.objectContaining({
          purgedCount: 2,
          retentionDays: 14,
        }),
      }));
    });
  });
});
