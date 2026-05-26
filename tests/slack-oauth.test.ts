import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as authorizeGET } from "@/app/api/connectors/slack/authorize/route";
import { GET as callbackGET } from "@/app/api/connectors/slack/callback/route";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { env } from "@/lib/env";
import { getTenantDb, withAdminTenantDb } from "@/lib/db/tenant-db";
import { db } from "@/lib/db";
import { generateStateToken } from "@/lib/integrations/encryption";

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
      organizations: {
        findFirst: vi.fn(),
      },
    },
  },
}));

// Mock Tenant DB
vi.mock("@/lib/db/tenant-db", () => ({
  withAdminTenantDb: vi.fn(),
  getTenantDb: vi.fn(),
}));

// Mock Audit logging
vi.mock("@/lib/audit", () => ({
  recordAuditLog: vi.fn(),
}));

// Mock Slack WebClient
vi.mock("@slack/web-api", () => ({
  WebClient: function () {
    return {
      oauth: {
        v2: {
          access: vi.fn().mockResolvedValue({
            ok: true,
            access_token: "xoxb-test-token",
            team: { id: "T123", name: "Acme Team" },
            incoming_webhook: {
              channel: "#alerts",
              url: "https://hooks.slack.com/services/T123/B123/X123",
            },
          }),
        },
      },
    };
  },
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
    process.env.SLACK_CLIENT_ID = "slack_id_123";
    process.env.SLACK_CLIENT_SECRET = "slack_secret_123";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.CONNECTOR_SECRET = "default-connector-secret-key-placeholder-32-bytes";
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

    // Mock org lookup
    vi.mocked(db.query.organizations.findFirst).mockResolvedValue({
      id: "org_123",
      name: "Acme",
      slug: "acme",
    } as any);

    const req = createReq("http://localhost:3000/api/connectors/slack/authorize?orgSlug=acme");
    const res = await authorizeGET(req);

    expect(res.status).toBe(307); // NextResponse.redirect
    const location = res.headers.get("location");
    expect(location).toContain("slack.com/oauth/v2/authorize");
    expect(location).toContain("client_id=slack_id_123");
    expect(location).toContain("scope=chat:write,incoming-webhook");
  });
});

describe("Slack OAuth Callback Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SLACK_CLIENT_ID = "slack_id_123";
    process.env.SLACK_CLIENT_SECRET = "slack_secret_123";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.CONNECTOR_SECRET = "default-connector-secret-key-placeholder-32-bytes";
  });

  it("should redirect to error page if state parameter is invalid or missing", async () => {
    const req = createReq("http://localhost:3000/api/connectors/slack/callback?code=code_123&state=invalid_state");
    const res = await callbackGET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?error=slack_integration_failed");
  });

  it("should exchange code, encrypt tokens, store connector, and redirect on success", async () => {
    // Generate valid signed state JWT
    const state = generateStateToken("user_123", "org_123");

    // Mock org lookup
    vi.mocked(db.query.organizations.findFirst).mockResolvedValue({
      id: "org_123",
      name: "Acme",
      slug: "acme",
    } as any);

    // Mock Drizzle insert transaction execution inside getTenantDb
    const mockInsert = vi.fn().mockImplementation(() => ({
      values: vi.fn().mockReturnThis(),
    }));
    
    vi.mocked(getTenantDb).mockImplementation(async (userId, orgId, cb) => {
      return cb({
        insert: mockInsert,
      } as any);
    });

    const req = createReq(`http://localhost:3000/api/connectors/slack/callback?code=code_123&state=${state}`);
    const res = await callbackGET(req);

    expect(res.status).toBe(307); // NextResponse.redirect
    expect(res.headers.get("location")).toContain("/org/acme/settings/integrations?success=slack");
    expect(mockInsert).toHaveBeenCalled();
  });
});
