import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, members, organizationDomains } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { recordAuditLog } from "@/lib/audit";

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

// GET /api/scim/v2/Users - List or filter users
export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return scimError("Unauthorized", 401);
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter"); // e.g., userName eq "user@example.com"
  
  try {
    let targetEmail: string | null = null;
    
    if (filter) {
      // Parse SCIM filter for username/email
      // Standard filter forms: userName eq "user@example.com" or emails[type eq "work"].value eq "user@example.com"
      const emailMatch = filter.match(/(?:userName|value)\s+eq\s+["']([^"']+)["']/i);
      if (emailMatch && emailMatch[1]) {
        targetEmail = emailMatch[1].toLowerCase();
      }
    }

    let results;
    if (targetEmail) {
      results = await db.query.users.findMany({
        where: eq(users.email, targetEmail),
      });
    } else {
      results = await db.query.users.findMany({
        limit: 100,
      });
    }

    const resources = results.map((u) => ({
      schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
      id: u.id,
      userName: u.email,
      name: {
        formatted: u.name,
        familyName: u.name.split(" ").slice(-1)[0] || "",
        givenName: u.name.split(" ")[0] || "",
      },
      emails: [
        {
          value: u.email,
          type: "work",
          primary: true,
        },
      ],
      active: true,
      meta: {
        resourceType: "User",
        created: u.createdAt.toISOString(),
        lastModified: u.updatedAt.toISOString(),
      },
    }));

    return NextResponse.json({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
      totalResults: resources.length,
      itemsPerPage: resources.length,
      startIndex: 1,
      Resources: resources,
    });
  } catch (err) {
    console.error("[SCIM GET] Error:", err);
    return scimError("Internal server error", 500);
  }
}

// POST /api/scim/v2/Users - Create/Provision User
export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return scimError("Unauthorized", 401);
  }

  try {
    const body = await req.json();
    const userName = body.userName || body.emails?.[0]?.value;
    
    if (!userName) {
      return scimError("userName or email is required", 400);
    }

    const email = userName.toLowerCase();
    const formattedName = body.name?.formatted || 
                          [body.name?.givenName, body.name?.familyName].filter(Boolean).join(" ") || 
                          email.split("@")[0];

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return scimError("Conflict: User already exists", 409);
    }

    // Insert user
    const userId = uuidv4();
    const now = new Date();
    await db.insert(users).values({
      id: userId,
      name: formattedName,
      email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    // Auto-associate user with verified domain organizations (SCIM JIT Integration)
    const domain = email.split("@")[1];
    if (domain) {
      const domainRecord = await db.query.organizationDomains.findFirst({
        where: and(
          eq(organizationDomains.domain, domain),
          eq(organizationDomains.isVerified, true)
        ),
      });

      if (domainRecord) {
        await db.insert(members).values({
          id: uuidv4(),
          organizationId: domainRecord.organizationId,
          userId,
          role: "member",
          createdAt: now,
        });

        await recordAuditLog({
          organizationId: domainRecord.organizationId,
          action: "MEMBER_SCIM_PROVISIONED",
          entityType: "MEMBER",
          entityId: userId,
          details: `Usuário provisionado via SCIM API (domínio verificado: ${domain})`,
          actor: { id: "SCIM-API", name: "SCIM Sync Engine", email: "scim@system" }
        });
      }
    }

    return NextResponse.json(
      {
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
        id: userId,
        userName: email,
        name: {
          formatted: formattedName,
          familyName: body.name?.familyName || "",
          givenName: body.name?.givenName || "",
        },
        emails: [
          {
            value: email,
            type: "work",
            primary: true,
          },
        ],
        active: true,
        meta: {
          resourceType: "User",
          created: now.toISOString(),
          lastModified: now.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[SCIM POST] Error:", err);
    return scimError("Internal server error", 500);
  }
}
