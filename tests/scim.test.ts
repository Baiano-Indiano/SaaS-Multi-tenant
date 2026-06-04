import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as listUsers, POST as createUser } from "@/app/api/scim/v2/Users/route";
import {
  GET as getUserById,
  PUT as updateUser,
  PATCH as patchUser,
  DELETE as deleteUser,
} from "@/app/api/scim/v2/Users/[id]/route";
import { db } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";

vi.mock("@/lib/db", () => {
  const mockTx = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockReturnThis(),
  };
  return {
    db: {
      query: {
        users: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        organizationDomains: {
          findFirst: vi.fn(),
        },
      },
      insert: mockTx.insert,
      values: mockTx.values,
      update: mockTx.update,
      set: mockTx.set,
      where: mockTx.where,
      delete: mockTx.delete,
    },
  };
});

vi.mock("@/lib/audit", () => ({
  recordAuditLog: vi.fn(),
}));

describe("SCIM v2 Directory Synchronization API", () => {
  const scimToken = "test_scim_token_xyz";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SCIM_BEARER_TOKEN = scimToken;
  });

  describe("GET /api/scim/v2/Users (List/Filter)", () => {
    it("should return 401 Unauthorized if Bearer token is missing or incorrect", async () => {
      const req = new NextRequest("http://localhost:3000/api/scim/v2/Users", {
        headers: {
          Authorization: "Bearer invalid_token",
        },
      });

      const res = await listUsers(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.detail).toBe("Unauthorized");
    });

    it("should return a list of users when authorized", async () => {
      const mockUsers = [
        {
          id: "u_1",
          email: "john@company.com",
          name: "John Doe",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.query.users.findMany).mockResolvedValue(mockUsers as any);

      const req = new NextRequest("http://localhost:3000/api/scim/v2/Users", {
        headers: {
          Authorization: `Bearer ${scimToken}`,
        },
      });

      const res = await listUsers(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.totalResults).toBe(1);
      expect(data.Resources[0].userName).toBe("john@company.com");
    });

    it("should filter by userName if filter param is provided", async () => {
      const mockUsers = [
        {
          id: "u_1",
          email: "john@company.com",
          name: "John Doe",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.query.users.findMany).mockResolvedValue(mockUsers as any);

      const req = new NextRequest(
        "http://localhost:3000/api/scim/v2/Users?filter=userName+eq+%22john@company.com%22",
        {
          headers: {
            Authorization: `Bearer ${scimToken}`,
          },
        }
      );

      const res = await listUsers(req);
      expect(res.status).toBe(200);
      expect(db.query.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
        })
      );
    });
  });

  describe("POST /api/scim/v2/Users (Create User / Provision)", () => {
    it("should create user and JIT associate if email domain is verified", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined); // User doesn't exist
      vi.mocked(db.query.organizationDomains.findFirst).mockResolvedValue({
        id: "dom_company",
        domain: "company.com",
        organizationId: "org_company_1",
        isVerified: true,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/scim/v2/Users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${scimToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: "alice@company.com",
          name: {
            givenName: "Alice",
            familyName: "Smith",
          },
        }),
      });

      const res = await createUser(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.userName).toBe("alice@company.com");
      expect(db.insert).toHaveBeenCalledTimes(2); // One for user, one for member JIT mapping
      expect(recordAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "MEMBER_SCIM_PROVISIONED",
          organizationId: "org_company_1",
        })
      );
    });
  });

  describe("GET /api/scim/v2/Users/[id]", () => {
    it("should return user details", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: "u_smith",
        email: "alice@company.com",
        name: "Alice Smith",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const req = new NextRequest("http://localhost:3000/api/scim/v2/Users/u_smith", {
        headers: {
          Authorization: `Bearer ${scimToken}`,
        },
      });

      const res = await getUserById(req, { params: Promise.resolve({ id: "u_smith" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe("u_smith");
    });
  });

  describe("PATCH /api/scim/v2/Users/[id] (deactivate user)", () => {
    it("should clear user sessions and memberships on deactivation", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: "u_smith",
        email: "alice@company.com",
        name: "Alice Smith",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const req = new NextRequest("http://localhost:3000/api/scim/v2/Users/u_smith", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${scimToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Operations: [
            {
              op: "replace",
              path: "active",
              value: false,
            },
          ],
        }),
      });

      const res = await patchUser(req, { params: Promise.resolve({ id: "u_smith" }) });
      expect(res.status).toBe(200);
      expect(db.delete).toHaveBeenCalledTimes(2); // Remove sessions and members relationships
    });
  });

  describe("DELETE /api/scim/v2/Users/[id]", () => {
    it("should cascade delete user records", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: "u_smith",
        email: "alice@company.com",
        name: "Alice Smith",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const req = new NextRequest("http://localhost:3000/api/scim/v2/Users/u_smith", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${scimToken}`,
        },
      });

      const res = await deleteUser(req, { params: Promise.resolve({ id: "u_smith" }) });
      expect(res.status).toBe(204);
      expect(db.delete).toHaveBeenCalled(); // deletes sessions, members, accounts, user
    });
  });
});
