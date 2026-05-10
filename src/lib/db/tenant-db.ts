import { db, readDb } from "./index";
import { members, organizations } from "./schema";
import { and, eq, sql } from "drizzle-orm";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const SAFE_SCHEMA_REGEX = /^tenant_[a-zA-Z0-9_]+$/;

export type TenantTransaction = PgTransaction<
  PostgresJsQueryResultHKT, 
  typeof schema, 
  ExtractTablesWithRelations<typeof schema>
>;

/**
 * getTenantDb
 * 
 * The core utility for Hardenend Multi-Tenancy.
 * 
 * @param userId - The ID of the user making the request.
 * @param organizationId - The target organization ID.
 * @param callback - Logic to execute.
 * @param options - Options like choosing between 'writer' or 'reader'.
 */
export async function getTenantDb<T>(
  userId: string,
  organizationId: string,
  callback: (tx: TenantTransaction) => Promise<T>,
  options: { mode?: 'writer' | 'reader' } = { mode: 'writer' }
): Promise<T> {
  const targetDb = options.mode === 'reader' ? readDb : db;

  // 1. Pre-flight Membership check
  const member = await db.query.members.findFirst({
    where: and(
      eq(members.userId, userId),
      eq(members.organizationId, organizationId)
    ),
    with: {
      organization: true
    }
  });

  if (!member || !member.organization.tenantSchemaName) {
    throw new Error("Access Denied: You are not a member of this organization.");
  }

  const tenantSchema = member.organization.tenantSchemaName;

  if (!SAFE_SCHEMA_REGEX.test(tenantSchema)) {
    throw new Error("Invalid tenant schema name detected. Aborting.");
  }

  /**
   * 2. Transaction-level Isolation
   * Note: We use a transaction to set search_path safely.
   */
  return await targetDb.transaction(async (tx) => {
    await tx.execute(sql.raw(`SET search_path TO "${tenantSchema}", public`));
    return await callback(tx as unknown as TenantTransaction);
  });
}

/**
 * Administrative bypass for getTenantDb (use with CAUTION)
 */
export async function withAdminTenantDb<T>(
  organizationId: string,
  callback: (tx: TenantTransaction) => Promise<T>,
  options: { mode?: 'writer' | 'reader' } = { mode: 'writer' }
): Promise<T> {
  const targetDb = options.mode === 'reader' ? readDb : db;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!org || !org.tenantSchemaName) {
    throw new Error("Organization or tenant schema not found.");
  }

  if (!SAFE_SCHEMA_REGEX.test(org.tenantSchemaName)) {
    throw new Error("Invalid tenant schema name detected. Aborting.");
  }

  return await targetDb.transaction(async (tx) => {
    await tx.execute(sql.raw(`SET search_path TO "${org.tenantSchemaName}", public`));
    return await callback(tx as unknown as TenantTransaction);
  });
}

