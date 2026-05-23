import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as authorizeGET } from "@/app/api/connectors/slack/authorize/route";
import { GET as callbackGET } from "@/app/api/connectors/slack/callback/route";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { env } from "@/lib/env";
import { withAdminTenantDb } from "@/lib/db/tenant-db";
import { db } from "@/lib/db";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock Better-Auth
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock Redis
vi.mock("@/lib/redis", () => ({
  redis: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  },
}));

// Mock env
vi.mock("@/lib/env", () => ({
  env: {
    SLACK_CLIENT_ID: "slack_id_123",
    SLACK_CLIENT_SECRET: "slack_secret_123",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

// Mock Database
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
  },
}));

// Mock Tenant DB
vi.mock("@/lib/db/tenant-db", () => ({
  withAdminTenantDb: vi.fn(),
  getTenantDb: vi.fn((uid, oid, cb) => cb({
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnThis(),
    })),
  })),
}));

// Mock Audit logging
vi.mock("@/lib/audit", () => ({
  recordAuditLog: vi.fn(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

function createReq(urlStr: string) {
  return new NextRequest(new URL(urlStr));
}

describe("Slack OAuth Authorize Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const req = createReq("http://localhost:3000/api/connectors/slack/authorize?orgSlug=acme");
    const res = await authorizeGET(req);
    expect(res.status).toBe(401);
  });

  it("should redirect to Slack authorize page and set Redis state key", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      session: { activeOrganizationId: "org_123" },
      user: { id: "user_123" },
    } as any);

    const req = createReq("http://localhost:3000/api/connectors/slack/authorize?orgSlug=acme");
    const res = await authorizeGET(req);

    expect(res.status).toBe(307); // NextResponse.redirect
    const location = res.headers.get("location");
    expect(location).toContain("slack.com/oauth/v2/authorize");
    expect(location).toContain("client_id=slack_id_123");
    expect(location).toContain("scope=incoming-webhook");
    expect(vi.mocked(redis.set)).toHaveBeenCalled();
  });
});

describe("Slack OAuth Callback Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if state parameter is invalid or missing from Redis", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    const req = createReq("http://localhost:3000/api/connectors/slack/callback?code=code_123&state=invalid_state");
    const res = await callbackGET(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid or expired state parameter");
  });

  it("should exchange code, encrypt tokens, store connector, and redirect on success", async () => {
    // 1. Mock Redis state recovery
    vi.mocked(redis.get).mockResolvedValue({
      userId: "user_123",
      orgId: "org_123",
      orgSlug: "acme",
    });

    // 2. Mock Slack token exchange response
    mockFetch.mockResolvedValue({
      json: async () => ({
        ok: true,
        access_token: "xoxb-test-token",
        team: { id: "T123", name: "Acme Team" },
        incoming_webhook: {
          channel: "#alerts",
          url: "https://hooks.slack.com/services/T123/B123/X123",
        },
      }),
    });

    // Mock Drizzle insert transaction execution
    const mockInsert = vi.fn().mockImplementation(() => ({
      values: vi.fn().mockResolvedValue([{ id: "conn_123" }]),
    }));
    vi.mocked(withAdminTenantDb).mockImplementation(async (orgId, cb) => {
      return cb({
        insert: mockInsert,
      } as any);
    });

    // Mock user record fetch
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: "user_123",
      name: "John Doe",
      email: "john@example.com",
    } as any);

    const req = createReq("http://localhost:3000/api/connectors/slack/callback?code=code_123&state=valid_state");
    const res = await callbackGET(req);

    expect(res.status).toBe(307); // NextResponse.redirect
    expect(res.headers.get("location")).toContain("/org/acme/settings/integrations?success=slack");
    expect(mockFetch).toHaveBeenCalledWith("https://slack.com/api/oauth.v2.access", expect.any(Object));
    expect(mockInsert).toHaveBeenCalled();
  });
});
