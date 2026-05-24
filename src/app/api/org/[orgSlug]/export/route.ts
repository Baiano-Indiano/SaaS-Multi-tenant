import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, members as membersTable, users as usersTable } from "@/lib/db/schema";
import { projects, auditLogs, apiKeys, webhooks, connectors, workflows, auditExportConfigs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/auth/rbac-utils";
import { withAdminTenantDb } from "@/lib/db/tenant-db";
import { recordAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import zlib from "zlib";

// Tell Next.js this route is dynamic
export const dynamic = "force-dynamic";

interface ZipFile {
  name: string;
  content: Buffer;
}

/**
 * Converts an array of objects into a standard CSV string.
 */
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return "";
  
  // Extract all unique keys as headers
  const headers = Object.keys(data[0]);
  
  const csvRows = [
    headers.join(","),
    ...data.map(row => 
      headers.map(fieldName => {
        let val = row[fieldName];
        if (val === null || val === undefined) {
          val = "";
        }
        if (val instanceof Date) {
          val = val.toISOString();
        }
        if (typeof val === "object") {
          val = JSON.stringify(val);
        }
        // Escape double quotes and wrap in quotes
        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
      }).join(",")
    )
  ];
  
  return csvRows.join("\n");
}

/**
 * Simple CRC-32 calculator for ZIP file headers.
 */
function crc32(data: Buffer): number {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
  }
  return (crc ^ -1) >>> 0;
}

/**
 * Creates a standard unencrypted ZIP file containing multiple files.
 * Uses deflateRawSync for compression.
 */
function createZip(files: ZipFile[]): Buffer {
  const localHeaders: Buffer[] = [];
  const centralDirectories: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const filenameBuf = Buffer.from(file.name, "utf-8");
    
    // Compress content using Deflate raw (no zlib headers)
    const compressedContent = zlib.deflateRawSync(file.content);
    const crc = crc32(file.content);
    const uncompressedSize = file.content.length;
    const compressedSize = compressedContent.length;

    // Current time in DOS format
    const dateObj = new Date();
    const dosTime = ((dateObj.getHours() & 0x1F) << 11) | ((dateObj.getMinutes() & 0x3F) << 5) | ((Math.floor(dateObj.getSeconds() / 2) & 0x1F));
    const dosDate = (((dateObj.getFullYear() - 1980) & 0x7F) << 9) | (((dateObj.getMonth() + 1) & 0x0F) << 5) | (dateObj.getDate() & 0x1F);

    // 1. Local File Header
    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0); // Local file header signature
    lfh.writeUInt16LE(20, 4); // Version needed to extract (2.0)
    lfh.writeUInt16LE(0, 6); // General purpose bit flag
    lfh.writeUInt16LE(8, 8); // Compression method (8 = Deflate)
    lfh.writeUInt16LE(dosTime, 10); // Last mod file time
    lfh.writeUInt16LE(dosDate, 12); // Last mod file date
    lfh.writeUInt32LE(crc, 14); // CRC-32
    lfh.writeUInt32LE(compressedSize, 18); // Compressed size
    lfh.writeUInt32LE(uncompressedSize, 22); // Uncompressed size
    lfh.writeUInt16LE(filenameBuf.length, 26); // File name length
    lfh.writeUInt16LE(0, 28); // Extra field length

    const localHeader = Buffer.concat([lfh, filenameBuf, compressedContent]);
    localHeaders.push(localHeader);

    // 2. Central Directory File Header
    const cdfh = Buffer.alloc(46);
    cdfh.writeUInt32LE(0x02014b50, 0); // Central directory file header signature
    cdfh.writeUInt16LE(20, 4); // Version made by
    cdfh.writeUInt16LE(20, 6); // Version needed to extract
    cdfh.writeUInt16LE(0, 8); // General purpose bit flag
    cdfh.writeUInt16LE(8, 10); // Compression method
    cdfh.writeUInt16LE(dosTime, 12); // Last mod file time
    cdfh.writeUInt16LE(dosDate, 14); // Last mod file date
    cdfh.writeUInt32LE(crc, 16); // CRC-32
    cdfh.writeUInt32LE(compressedSize, 20); // Compressed size
    cdfh.writeUInt32LE(uncompressedSize, 24); // Uncompressed size
    cdfh.writeUInt16LE(filenameBuf.length, 28); // File name length
    cdfh.writeUInt16LE(0, 30); // Extra field length
    cdfh.writeUInt16LE(0, 32); // File comment length
    cdfh.writeUInt16LE(0, 34); // Disk number start
    cdfh.writeUInt16LE(0, 36); // Internal file attributes
    cdfh.writeUInt32LE(0, 38); // External file attributes
    cdfh.writeUInt32LE(offset, 42); // Relative offset of local header

    const centralDirectory = Buffer.concat([cdfh, filenameBuf]);
    centralDirectories.push(centralDirectory);

    offset += localHeader.length;
  }

  const centralDirectoryData = Buffer.concat(centralDirectories);
  const totalCentralDirectoryRecords = files.length;
  const sizeOfCentralDirectory = centralDirectoryData.length;

  // 3. End of Central Directory Record
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // End of central directory signature
  eocd.writeUInt16LE(0, 4); // Number of this disk
  eocd.writeUInt16LE(0, 6); // Disk where central directory starts
  eocd.writeUInt16LE(totalCentralDirectoryRecords, 8); // Number of central directory records on this disk
  eocd.writeUInt16LE(totalCentralDirectoryRecords, 10); // Total number of central directory records
  eocd.writeUInt32LE(sizeOfCentralDirectory, 12); // Size of central directory
  eocd.writeUInt32LE(offset, 16); // Offset of start of central directory, relative to start of archive
  eocd.writeUInt16LE(0, 20); // Comment length

  return Buffer.concat([...localHeaders, centralDirectoryData, eocd]);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const start = Date.now();
  const { orgSlug } = await params;
  logger.info("api", `➜ GET /api/org/${orgSlug}/export`);

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      logger.warn("api", `GET /api/org/${orgSlug}/export - Unauthorized`);
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Resolve organization
    const orgs = await db.select().from(organizations).where(eq(organizations.slug, orgSlug)).limit(1);
    const org = orgs[0];
    if (!org) {
      logger.warn("api", `GET /api/org/${orgSlug}/export - Organization not found`);
      return new NextResponse("Organization Not Found", { status: 404 });
    }

    // Authorization: User must have 'org:update' permission
    await requirePermission(session.user.id, org.id, "org:update");

    // Fetch members from public schema (associated with this organization)
    const orgMembers = await db
      .select({
        id: membersTable.id,
        userId: membersTable.userId,
        role: membersTable.role,
        roleId: membersTable.roleId,
        createdAt: membersTable.createdAt,
        userName: usersTable.name,
        userEmail: usersTable.email,
      })
      .from(membersTable)
      .where(eq(membersTable.organizationId, org.id))
      .leftJoin(usersTable, eq(membersTable.userId, usersTable.id));

    // Fetch tenant-isolated tables (projects, audit logs, and configurations)
    const tenantData = await withAdminTenantDb(org.id, async (tx) => {
      const orgProjects = await tx.select().from(projects).orderBy(projects.createdAt);
      const orgAuditLogs = await tx.select().from(auditLogs).orderBy(auditLogs.createdAt);
      const orgApiKeys = await tx.select().from(apiKeys).orderBy(apiKeys.createdAt);
      const orgWebhooks = await tx.select().from(webhooks).orderBy(webhooks.createdAt);
      const orgConnectors = await tx.select().from(connectors).orderBy(connectors.createdAt);
      const orgWorkflows = await tx.select().from(workflows).orderBy(workflows.createdAt);
      const orgExportConfigs = await tx.select().from(auditExportConfigs).orderBy(auditExportConfigs.createdAt);

      return {
        projects: orgProjects,
        auditLogs: orgAuditLogs,
        apiKeys: orgApiKeys.map(k => ({
          id: k.id,
          name: k.name,
          keyPrefix: k.keyPrefix,
          roleId: k.roleId,
          lastUsedAt: k.lastUsedAt,
          expiresAt: k.expiresAt,
          createdAt: k.createdAt,
        })), // Sanitize keyHash to prevent leak
        webhooks: orgWebhooks,
        connectors: orgConnectors,
        workflows: orgWorkflows,
        auditExportConfigs: orgExportConfigs,
      };
    }, { mode: 'reader' });

    // Package configurations into a single object
    const configs = {
      apiKeys: tenantData.apiKeys,
      webhooks: tenantData.webhooks,
      connectors: tenantData.connectors,
      workflows: tenantData.workflows,
      auditExportConfigs: tenantData.auditExportConfigs,
    };

    // Prepare files for the ZIP archive
    const zipFiles: ZipFile[] = [
      {
        name: "projects.json",
        content: Buffer.from(JSON.stringify(tenantData.projects, null, 2), "utf-8"),
      },
      {
        name: "projects.csv",
        content: Buffer.from(convertToCSV(tenantData.projects), "utf-8"),
      },
      {
        name: "members.json",
        content: Buffer.from(JSON.stringify(orgMembers, null, 2), "utf-8"),
      },
      {
        name: "members.csv",
        content: Buffer.from(convertToCSV(orgMembers), "utf-8"),
      },
      {
        name: "audit_logs.json",
        content: Buffer.from(JSON.stringify(tenantData.auditLogs, null, 2), "utf-8"),
      },
      {
        name: "audit_logs.csv",
        content: Buffer.from(convertToCSV(tenantData.auditLogs), "utf-8"),
      },
      {
        name: "configs.json",
        content: Buffer.from(JSON.stringify(configs, null, 2), "utf-8"),
      },
    ];

    // Compress files into a single ZIP buffer
    const zipBuffer = createZip(zipFiles);

    // Record Audit Log (Phase 45)
    await recordAuditLog({
      organizationId: org.id,
      action: "DATA_EXPORTED",
      entityType: "ORGANIZATION",
      entityId: org.id,
      details: `Exported organization data as ZIP containing ${tenantData.projects.length} projects, ${orgMembers.length} members, and configurations`,
      actor: {
        id: session.user.id,
        name: session.user.name || "Unknown",
        email: session.user.email,
      }
    });

    const duration = Date.now() - start;
    logger.info("api", `✓ GET /api/org/${orgSlug}/export | 200 | ${duration}ms`);

    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${orgSlug}-export-${new Date().toISOString().split("T")[0]}.zip"`,
      },
    });

  } catch (error) {
    logger.error("api", `✗ GET /api/org/${orgSlug}/export | Internal Server Error`, error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
