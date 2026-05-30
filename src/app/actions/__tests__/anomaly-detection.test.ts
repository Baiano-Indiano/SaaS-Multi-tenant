import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackMfaFailure } from "@/lib/security/mfa-tracker";
import { triggerAnomalyAlert } from "@/lib/security/anomaly-trigger";
import { GET as anomalyDetectorCron } from "@/app/api/cron/anomaly-detector/route";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { recordAuditLog } from "@/lib/audit";
import { sendAnomalyAlertEmail } from "@/lib/mail";
import { withAdminTenantDb } from "@/lib/db/tenant-db";
import { organizations, members } from "@/lib/db/schema";

// Global mock state
let mockOrgs = [{ id: "org_1", tenantSchemaName: "tenant_1", name: "Acme Corp" }];
let mockMembers = [{ organizationId: "org_1" }];
let mockAdmins = [{ email: "admin1@acme.com", name: "Admin 1" }];

// Mock dependencies
vi.mock("@/lib/db", () => {
  const mockDb = {
    select: vi.fn().mockImplementation(() => {
      const chain: any = {};
      chain.from = vi.fn().mockImplementation((table: any) => {
        let result = mockAdmins;
        if (table === organizations) {
          result = mockOrgs;
        } else if (table === members) {
          result = mockMembers;
        }

        const promise = Promise.resolve(result) as any;
        promise.innerJoin = vi.fn().mockImplementation(() => {
          const joinPromise = Promise.resolve(mockAdmins) as any;
          joinPromise.where = vi.fn().mockImplementation(() => Promise.resolve(mockAdmins));
          return joinPromise;
        });
        promise.where = vi.fn().mockImplementation(() => Promise.resolve(result));
        return promise;
      });
      return chain;
    }),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ id: "1" }]),
    query: {
      organizations: {
        findFirst: vi.fn().mockImplementation(() => {
          return Promise.resolve(mockOrgs[0] || { id: "org_1", name: "Acme Corp" });
        }),
      },
    },
  };
  return { db: mockDb };
});

vi.mock("@/lib/redis", () => ({
  redis: {
    incr: vi.fn(),
    expire: vi.fn(),
    mget: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock("@/lib/audit", () => ({
  recordAuditLog: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/mail", () => ({
  sendAnomalyAlertEmail: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/db/tenant-db", () => ({
  withAdminTenantDb: vi.fn(async (orgId, callback) => {
    const mockTx = {
      execute: vi.fn().mockResolvedValue([{ last_hour: 60, last_24h: 120 }]), // 60/hr last hour, 120 total in 24h -> avg is 5/hr. 60 > 15 (3x avg). Surge!
    };
    return callback(mockTx);
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(undefined),
  securityActionRateLimit: {},
}));

describe("Anomaly Detection Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "super-secret-cron-token";
    
    // Reset global mocks to default safe states
    mockOrgs = [{ id: "org_1", tenantSchemaName: "tenant_1", name: "Acme Corp" }];
    mockMembers = [{ organizationId: "org_1" }];
    mockAdmins = [{ email: "admin1@acme.com", name: "Admin 1" }];
  });

  describe("trackMfaFailure()", () => {
    it("should increment Redis failure counters for each organization membership", async () => {
      vi.mocked(redis.incr).mockResolvedValue(1);
      vi.mocked(redis.mget).mockResolvedValue([1, 1, 0, 1, 0]);

      await trackMfaFailure("user_1");

      expect(db.select).toHaveBeenCalled();
      expect(redis.incr).toHaveBeenCalledWith(expect.stringContaining("org_1:mfa_failures_5m"));
      expect(redis.incr).toHaveBeenCalledWith("org:org_1:mfa_failures_24h");
      expect(redis.expire).toHaveBeenCalledTimes(2); // Short & Long key expirations
    });

    it("should trigger MFA_SPIKE alert if failures in the last 5 minutes exceed 10", async () => {
      vi.mocked(redis.incr).mockResolvedValue(1);
      // Mock mget returning a sum of 12 failures
      vi.mocked(redis.mget).mockResolvedValue([3, 4, 2, 3, 0]);

      // Mock empty admins query to trigger fallback alert
      mockAdmins = [];

      await trackMfaFailure("user_1");

      expect(redis.mget).toHaveBeenCalled();
      expect(sendAnomalyAlertEmail).toHaveBeenCalledWith(expect.objectContaining({
        type: "MFA_SPIKE",
        details: expect.stringContaining("Pico crítico de falhas de autenticação de dois fatores detectado no curto prazo: 12 tentativas malsucedidas nos últimos 5 minutos."),
      }));
    });

    it("should trigger MFA_SPIKE alert if failures in the last 24 hours exceed 30", async () => {
      // Mock long count as 35 (which is > 30)
      vi.mocked(redis.incr).mockImplementation(async (key: string) => {
        if (key.includes("mfa_failures_24h")) return 35;
        return 1;
      });
      // Short window sum is only 2 (below 10)
      vi.mocked(redis.mget).mockResolvedValue([1, 1, 0, 0, 0]);
      mockAdmins = [];

      await trackMfaFailure("user_1");

      expect(sendAnomalyAlertEmail).toHaveBeenCalledWith(expect.objectContaining({
        type: "MFA_SPIKE",
        details: expect.stringContaining("Aviso de segurança: Volume incomum de falhas de autenticação de dois fatores detectado nas últimas 24 horas: 35 tentativas malsucedidas."),
      }));
    });
  });

  describe("triggerAnomalyAlert()", () => {
    it("should abort sending alert emails if the type is on cooldown", async () => {
      vi.mocked(redis.get).mockResolvedValue("1"); // Cooldown key exists

      await triggerAnomalyAlert("org_1", "MFA_SPIKE", "Brute-force testing");

      expect(redis.get).toHaveBeenCalledWith("org:org_1:anomaly_cooldown:MFA_SPIKE");
      expect(sendAnomalyAlertEmail).not.toHaveBeenCalled();
    });

    it("should alert security team email list (orphan tenant fallback) if no admins exist", async () => {
      vi.mocked(redis.get).mockResolvedValue(null); // No cooldown
      mockAdmins = []; // Empty admin members query

      await triggerAnomalyAlert("org_1", "MFA_SPIKE", "Brute-force testing");

      expect(redis.set).toHaveBeenCalledWith("org:org_1:anomaly_cooldown:MFA_SPIKE", "1", { ex: 1800 });
      expect(sendAnomalyAlertEmail).toHaveBeenCalledWith({
        to: "security@saas-starter.internal",
        orgName: "Acme Corp",
        type: "MFA_SPIKE",
        details: "Brute-force testing",
      });
      expect(recordAuditLog).toHaveBeenCalled();
    });

    it("should email all active administrators and log events in the audit trail", async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      // Mock two admins found
      mockAdmins = [
        { email: "admin1@acme.com", name: "Admin 1" },
        { email: "admin2@acme.com", name: "Admin 2" },
      ];

      await triggerAnomalyAlert("org_1", "WEBHOOK_SURGE", "Excessive webhook consumption");

      expect(sendAnomalyAlertEmail).toHaveBeenCalledTimes(2);
      expect(sendAnomalyAlertEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: "admin1@acme.com",
        type: "WEBHOOK_SURGE",
      }));
      expect(sendAnomalyAlertEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: "admin2@acme.com",
        type: "WEBHOOK_SURGE",
      }));
    });
  });

  describe("Webhook Anomaly Detector Cron", () => {
    it("should return 401 if unauthorized request attempt", async () => {
      const request = new Request("http://localhost/api/cron/anomaly-detector", {
        headers: { authorization: "Bearer invalid" },
      });
      const response = await anomalyDetectorCron(request);
      expect(response.status).toBe(401);
    });

    it("should scan tenant metrics and trigger surge warning alerts", async () => {
      const request = new Request("http://localhost/api/cron/anomaly-detector", {
        headers: { authorization: "Bearer super-secret-cron-token" },
      });

      // Mock list of organizations returned by query
      mockOrgs = [{ id: "org_abc", tenantSchemaName: "tenant_abc", name: "Acme Corp" }];

      // Mock no cooldown and empty admins query
      vi.mocked(redis.get).mockResolvedValue(null);
      mockAdmins = [];

      const response = await anomalyDetectorCron(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.processed).toBe(1);
      expect(json.triggered).toBe(1); // 1 alert triggered
      expect(json.failed).toBe(0);

      expect(withAdminTenantDb).toHaveBeenCalledWith("org_abc", expect.any(Function));
      expect(sendAnomalyAlertEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: "security@saas-starter.internal",
        type: "WEBHOOK_SURGE",
        details: expect.stringContaining("Tráfego de webhooks anômalo: 60 disparos na última hora excedendo a média móvel das últimas 24h (5.0/h) em mais de 300%."),
      }));
    });
  });
});
