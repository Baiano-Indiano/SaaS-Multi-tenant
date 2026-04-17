/**
 * Shared constants for RBAC that can be safely imported 
 * from both server and client code.
 * 
 * This file MUST NOT import any server-only modules (db, postgres, etc).
 */

/**
 * Metadata key for storing permissions in Better-Auth session.
 */
export const PERMISSIONS_METADATA_KEY = "permissions";
