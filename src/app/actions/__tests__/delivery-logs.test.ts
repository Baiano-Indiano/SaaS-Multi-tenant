import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDeliveryLogsAction, retryWebhookDeliveryAction } from "../delivery-logs";
import { auth } from "@/lib/auth";
import { withAdminTenantDb } from "@/lib/db/tenant-db";

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

// Setup QStash mock
const mockPublishJSON = vi.fn().mockResolvedValue({ messageId: "msg_123" });
vi.mock("@upstash/qstash", () => {
  return {
    Client: class {
      publishJSON = mockPublishJSON;
    },
  };
});

let mockTxResults: any[] = [];
let mockDbInsertValues: any = null;

vi.mock("@/lib/db/tenant-db", () => ({
  withAdminTenantDb: vi.fn(async (orgId, callback) => {
    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => {
        return mockTxResults;
      }),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockImplementation((val) => {
        mockDbInsertValues = val;
        return Promise.resolve();
      }),
      where: vi.fn().mockReturnThis(),
    };
    return callback(mockTx);
  }),
}));

describe("Delivery Logs Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTxResults = [];
    mockDbInsertValues = null;
    process.env.QSTASH_TOKEN = "test-token";
  });

  describe("getDeliveryLogsAction()", () => {
    it("should successfully retrieve delivery logs using left joins", async () => {
      mockTxResults = [
        {
          id: "wd_1",
          eventType: "project.created",
          payload: '{"name":"project-1"}',
          responseStatus: "200",
          responseBody: "OK",
          duration: "15ms",
          createdAt: new Date(),
          workflowTrigger: "project.created",
          connectorType: "slack",
          connectorName: "Slack Work",
          webhookUrl: null,
        },
      ];

      const result = await getDeliveryLogsAction("org_1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("wd_1");
      expect(result[0].connectorType).toBe("slack");
      expect(withAdminTenantDb).toHaveBeenCalledWith("org_1", expect.any(Function));
    });

    it("should return empty array on database error", async () => {
      vi.mocked(withAdminTenantDb).mockRejectedValueOnce(new Error("Db failure"));
      const result = await getDeliveryLogsAction("org_1");
      expect(result).toEqual([]);
    });
  });

  describe("retryWebhookDeliveryAction()", () => {
    const orgId = "org_123";
    const oldDeliveryId = "wd_old_1";

    it("should fail if the user session is expired or unauthorized", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      await expect(retryWebhookDeliveryAction(orgId, oldDeliveryId)).rejects.toThrow("Unauthorized");
    });

    it("should fail if the original log is not found", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user_1" },
        session: { activeOrganizationId: orgId },
      } as any);
      
      mockTxResults = []; // No log returned

      await expect(retryWebhookDeliveryAction(orgId, oldDeliveryId)).rejects.toThrow("Log de entrega original não encontrado.");
    });

    it("should fail if the target destination cannot be resolved", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user_1" },
        session: { activeOrganizationId: orgId },
      } as any);

      // Return a log with a workflowId, but we will mock next queries to return no workflow config
      mockTxResults = [
        {
          eventType: "project.created",
          payload: '{"name":"proj"}',
          workflowId: "wf_123",
          webhookId: null,
        },
      ];

      // Second query mock will return empty array (no workflow found)
      vi.mocked(withAdminTenantDb).mockImplementationOnce(async (id, cb) => {
        return cb({
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnValue([
            {
              eventType: "project.created",
              payload: '{"name":"proj"}',
              workflowId: "wf_123",
              webhookId: null,
            }
          ])
        } as any);
      }).mockImplementationOnce(async (id, cb) => {
        return cb({
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnValue([]) // No workflow resolved
        } as any);
      });

      await expect(retryWebhookDeliveryAction(orgId, oldDeliveryId)).rejects.toThrow("Não foi possível resolver o destino do webhook para re-envio.");
    });

    it("should successfully log new delivery entry and dispatch it via QStash for standard webhooks", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "user_1" },
        session: { activeOrganizationId: orgId },
      } as any);

      let selectCount = 0;

      // Mock database calls sequentially
      vi.mocked(withAdminTenantDb).mockImplementation(async (id, cb) => {
        const mockTx = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockImplementation(() => {
            selectCount++;
            if (selectCount === 1) {
              return [
                {
                  eventType: "project.created",
                  payload: '{"name":"project-x"}',
                  workflowId: null,
                  webhookId: "wh_789",
                }
              ];
            }
            return [
              {
                id: "wh_789",
                url: "https://example.com/webhook",
                secret: "wh_secret_value",
              }
            ];
          }),
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockImplementation((val) => {
            mockDbInsertValues = val;
            return Promise.resolve();
          }),
        };
        return cb(mockTx as any);
      });

      const result = await retryWebhookDeliveryAction(orgId, oldDeliveryId);
      expect(result.success).toBe(true);
      expect(result.newDeliveryId).toBeDefined();

      // Verify log insertion
      expect(mockDbInsertValues).toBeDefined();
      expect(mockDbInsertValues.webhookId).toBe("wh_789");
      expect(mockDbInsertValues.status).toBe("processing");
      expect(mockDbInsertValues.payload).toBe('{"name":"project-x"}');

      // Verify QStash dispatch
      expect(mockPublishJSON).toHaveBeenCalledWith(expect.objectContaining({
        url: expect.stringContaining("/api/webhooks/qstash-handler"),
        body: expect.objectContaining({
          orgId,
          deliveryId: result.newDeliveryId,
          webhookId: "wh_789",
          targetUrl: "https://example.com/webhook",
          event: "project.created",
          secret: "wh_secret_value",
        }),
      }));
    });
  });
});
