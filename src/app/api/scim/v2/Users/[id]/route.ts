import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, members, sessions, accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Helper to authenticate SCIM requests using Bearer Token
function isAuthenticated(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.substring(7).trim();
  const scimToken = process.env.SCIM_BEARER_TOKEN || "scim_test_token_2026";
  return token === scimToken;
}

// Standard SCIM Error Response
function scimError(detail: string, status: number) {
  return NextResponse.json(
    {
      schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
      detail,
      status: status.toString(),
    },
    { status }
  );
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/scim/v2/Users/[id] - Get specific user
export async function GET(req: NextRequest, { params }: RouteContext) {
  if (!isAuthenticated(req)) {
    return scimError("Unauthorized", 401);
  }

  const { id } = await params;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return scimError("User not found", 404);
    }

    return NextResponse.json({
      schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
      id: user.id,
      userName: user.email,
      name: {
        formatted: user.name,
        familyName: user.name.split(" ").slice(-1)[0] || "",
        givenName: user.name.split(" ")[0] || "",
      },
      emails: [
        {
          value: user.email,
          type: "work",
          primary: true,
        },
      ],
      active: true,
      meta: {
        resourceType: "User",
        created: user.createdAt.toISOString(),
        lastModified: user.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[SCIM GET ID] Error:", err);
    return scimError("Internal server error", 500);
  }
}

// PUT /api/scim/v2/Users/[id] - Full update
export async function PUT(req: NextRequest, { params }: RouteContext) {
  if (!isAuthenticated(req)) {
    return scimError("Unauthorized", 401);
  }

  const { id } = await params;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return scimError("User not found", 404);
    }

    const body = await req.json();
    const formattedName = body.name?.formatted || 
                          [body.name?.givenName, body.name?.familyName].filter(Boolean).join(" ") || 
                          user.name;

    const now = new Date();
    await db.update(users)
      .set({
        name: formattedName,
        updatedAt: now,
      })
      .where(eq(users.id, id));

    return NextResponse.json({
      schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
      id: user.id,
      userName: user.email,
      name: {
        formatted: formattedName,
        familyName: body.name?.familyName || "",
        givenName: body.name?.givenName || "",
      },
      emails: [
        {
          value: user.email,
          type: "work",
          primary: true,
        },
      ],
      active: true,
      meta: {
        resourceType: "User",
        created: user.createdAt.toISOString(),
        lastModified: now.toISOString(),
      },
    });
  } catch (err) {
    console.error("[SCIM PUT ID] Error:", err);
    return scimError("Internal server error", 500);
  }
}

// PATCH /api/scim/v2/Users/[id] - Partial update (e.g. deactivate user)
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  if (!isAuthenticated(req)) {
    return scimError("Unauthorized", 401);
  }

  const { id } = await params;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return scimError("User not found", 404);
    }

    const body = await req.json();
    
    // Check if the operation is a deactivation (e.g., active: false)
    // SCIM format for PATCH operations: { Operations: [ { op: "replace", path: "active", value: false } ] }
    const operations = body.Operations || [];
    const deactivateOp = operations.find(
      (op: unknown) => {
        if (typeof op !== "object" || op === null) return false;
        const opObj = op as Record<string, unknown>;
        const opStr = typeof opObj.op === "string" ? opObj.op.toLowerCase() : "";
        const pathStr = typeof opObj.path === "string" ? opObj.path : "";
        const val = opObj.value;
        return (
          (opStr === "replace" && pathStr === "active" && val === false) ||
          (opStr === "replace" && typeof val === "object" && val !== null && (val as Record<string, unknown>).active === false)
        );
      }
    );

    const now = new Date();

    if (deactivateOp) {
      // Deactivate user by revoking all their sessions and members relations
      await db.delete(sessions).where(eq(sessions.userId, id));
      await db.delete(members).where(eq(members.userId, id));
    }

    await db.update(users)
      .set({ updatedAt: now })
      .where(eq(users.id, id));

    return NextResponse.json({
      schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
      id: user.id,
      userName: user.email,
      name: {
        formatted: user.name,
        familyName: user.name.split(" ").slice(-1)[0] || "",
        givenName: user.name.split(" ")[0] || "",
      },
      emails: [
        {
          value: user.email,
          type: "work",
          primary: true,
        },
      ],
      active: deactivateOp ? false : true,
      meta: {
        resourceType: "User",
        created: user.createdAt.toISOString(),
        lastModified: now.toISOString(),
      },
    });
  } catch (err) {
    console.error("[SCIM PATCH ID] Error:", err);
    return scimError("Internal server error", 500);
  }
}

// DELETE /api/scim/v2/Users/[id] - Delete/deprovision user
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  if (!isAuthenticated(req)) {
    return scimError("Unauthorized", 401);
  }

  const { id } = await params;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return scimError("User not found", 404);
    }

    // Cascade delete relations
    await db.delete(sessions).where(eq(sessions.userId, id));
    await db.delete(members).where(eq(members.userId, id));
    await db.delete(accounts).where(eq(accounts.userId, id));
    await db.delete(users).where(eq(users.id, id));

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[SCIM DELETE ID] Error:", err);
    return scimError("Internal server error", 500);
  }
}
