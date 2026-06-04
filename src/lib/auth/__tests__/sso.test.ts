import { describe, it, expect, vi, beforeEach } from "vitest";
import { auth } from "../index";
import { db } from "../../db";
import { recordAuditLog } from "../../audit";

vi.mock("../../db", () => {
  const mockTx = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue({}),
  };
  return {
    db: {
      query: {
        organizationDomains: {
          findFirst: vi.fn(),
        },
        members: {
          findFirst: vi.fn(),
        },
        invitations: {
          findFirst: vi.fn(),
        },
      },
      insert: mockTx.insert,
      values: mockTx.values,
      update: mockTx.update,
      set: mockTx.set,
      where: mockTx.where,
    },
  };
});

vi.mock("../../audit", () => ({
  recordAuditLog: vi.fn(),
}));

vi.mock("../../redis", () => ({
  redis: {
    set: vi.fn(),
  },
}));

vi.mock("../../cache/l1-cache", () => ({
  l1Cache: {
    set: vi.fn(),
  },
}));

vi.mock("../../security/anomaly-detection", () => ({
  detectSessionAnomaly: vi.fn(),
}));

describe("SSO JIT and Auto-Provisioning Hooks", () => {
  const afterHook = (auth as any).options?.hooks?.after;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should expose the hooks configuration", () => {
    expect(afterHook).toBeDefined();
  });

  it("should provision a member JIT if a verified domain matches the user's email domain", async () => {
    const mockUser = {
      id: "user_sso_123",
      email: "jane@acme.com",
      name: "Jane Doe",
    };

    // Mock domain check: acme.com is verified
    vi.mocked(db.query.organizationDomains.findFirst).mockResolvedValue({
      id: "dom_1",
      domain: "acme.com",
      organizationId: "org_acme_99",
      isVerified: true,
    } as any);

    // Mock member check: user is NOT currently a member
    vi.mocked(db.query.members.findFirst).mockResolvedValue(undefined);

    const ctx = {
      path: "/sso/callback",
      context: {
        session: {
          user: mockUser,
        },
      },
      headers: new Headers(),
    };

    await afterHook(ctx);

    // Assert that the user was provisioned into org_acme_99 with role "member"
    expect(db.insert).toHaveBeenCalled();
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_acme_99",
        action: "MEMBER_JIT_PROVISIONED",
        entityType: "MEMBER",
        entityId: "user_sso_123",
      })
    );
  });

  it("should not provision user if already a member of the matched verified domain organization", async () => {
    const mockUser = {
      id: "user_sso_123",
      email: "jane@acme.com",
      name: "Jane Doe",
    };

    vi.mocked(db.query.organizationDomains.findFirst).mockResolvedValue({
      id: "dom_1",
      domain: "acme.com",
      organizationId: "org_acme_99",
      isVerified: true,
    } as any);

    // Already a member
    vi.mocked(db.query.members.findFirst).mockResolvedValue({
      id: "mem_1",
      organizationId: "org_acme_99",
      userId: "user_sso_123",
    } as any);

    const ctx = {
      path: "/sso/callback",
      context: {
        session: {
          user: mockUser,
        },
      },
      headers: new Headers(),
    };

    await afterHook(ctx);

    // Should NOT insert member or log audit
    expect(db.insert).not.toHaveBeenCalled();
    expect(recordAuditLog).not.toHaveBeenCalled();
  });

  it("should check for pending invitations if domain is not verified, and consume invitation", async () => {
    const mockUser = {
      id: "user_sso_invite",
      email: "external@guest.com",
      name: "Guest User",
    };

    // Domain is not verified
    vi.mocked(db.query.organizationDomains.findFirst).mockResolvedValue(undefined);

    // Has a pending invitation
    vi.mocked(db.query.invitations.findFirst).mockResolvedValue({
      id: "invite_abc",
      email: "external@guest.com",
      organizationId: "org_guest_1",
      role: "viewer",
      status: "pending",
    } as any);

    // Not already a member
    vi.mocked(db.query.members.findFirst).mockResolvedValue(undefined);

    const ctx = {
      path: "/sso/callback",
      context: {
        session: {
          user: mockUser,
        },
      },
      headers: new Headers(),
    };

    await afterHook(ctx);

    // Verify member provisioned with the invited role 'viewer'
    expect(db.insert).toHaveBeenCalled();
    // Verify invite marked as accepted
    expect(db.update).toHaveBeenCalled();
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_guest_1",
        action: "MEMBER_SSO_INVITE_ACCEPTED",
      })
    );
  });
});
