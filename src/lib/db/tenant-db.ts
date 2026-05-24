import { db, readDb } from "./index";
import { members, organizations } from "./schema";
import { and, eq, sql } from "drizzle-orm";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { logger } from "../logger";

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
  const start = Date.now();
  const targetDb = options.mode === 'reader' ? readDb : db;

  logger.info('db', `Initiating pre-flight membership verification: User ${userId} for Org ${organizationId}`);

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
    logger.warn('db', `Pre-flight verification failed: User ${userId} is not a member of Org ${organizationId}`);
    throw new Error("Access Denied: You are not a member of this organization.");
  }

  const tenantSchema = member.organization.tenantSchemaName;

  if (!SAFE_SCHEMA_REGEX.test(tenantSchema)) {
    logger.error('db', `Security Alert: Invalid tenant schema name "${tenantSchema}" for Org ${organizationId}`);
    throw new Error("Invalid tenant schema name detected. Aborting.");
  }

  /**
   * 2. Transaction-level Isolation
   * Note: We use a transaction to set search_path safely.
   */
  logger.db('SET search_path', tenantSchema, 'pending');
  try {
    const result = await targetDb.transaction(async (tx) => {
      await tx.execute(sql.raw(`SET search_path TO "${tenantSchema}", public`));
      return await callback(tx as unknown as TenantTransaction);
    });
    
    const duration = Date.now() - start;
    logger.db('Transaction', tenantSchema, 'success', duration);
    return result;
  } catch (error: unknown) {
    const duration = Date.now() - start;
    logger.db('Transaction', tenantSchema, 'failed', duration, error);
    throw error;
  }
}

/**
 * Administrative bypass for getTenantDb (use with CAUTION)
 */
export async function withAdminTenantDb<T>(
  organizationId: string,
  callback: (tx: TenantTransaction) => Promise<T>,
  options: { mode?: 'writer' | 'reader' } = { mode: 'writer' }
): Promise<T> {
  const start = Date.now();
  const targetDb = options.mode === 'reader' ? readDb : db;

  logger.info('db', `Administrative context bypass initiated for Org ${organizationId}`);

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!org || !org.tenantSchemaName) {
    logger.warn('db', `Admin pre-flight failed: Organization or tenant schema not found for Org ${organizationId}`);
    throw new Error("Organization or tenant schema not found.");
  }

  if (!SAFE_SCHEMA_REGEX.test(org.tenantSchemaName)) {
    logger.error('db', `Security Alert: Invalid tenant schema name "${org.tenantSchemaName}" during Admin bypass for Org ${organizationId}`);
    throw new Error("Invalid tenant schema name detected. Aborting.");
  }

  const tenantSchema = org.tenantSchemaName;

  logger.db('SET search_path (Admin)', tenantSchema, 'pending');
  try {
    const result = await targetDb.transaction(async (tx) => {
      await tx.execute(sql.raw(`SET search_path TO "${tenantSchema}", public`));
      return await callback(tx as unknown as TenantTransaction);
    });

    const duration = Date.now() - start;
    logger.db('Transaction (Admin)', tenantSchema, 'success', duration);
    return result;
  } catch (error: unknown) {
    const duration = Date.now() - start;
    logger.db('Transaction (Admin)', tenantSchema, 'failed', duration, error);
    throw error;
  }
}


