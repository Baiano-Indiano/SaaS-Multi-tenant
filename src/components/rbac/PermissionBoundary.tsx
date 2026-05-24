"use client";

import { ReactNode } from "react";
import { PermissionKey } from "@/lib/auth/permissions";

interface PermissionBoundaryProps {
  /**
   * Permissions required to see the content.
   */
  permissions: PermissionKey[] | PermissionKey;
  
  /**
   * Mode for checking multiple permissions.
   * 'any': user must have at least one of the permissions.
   * 'all': user must have all of the permissions.
   * Defaults to 'all'.
   */
  mode?: 'any' | 'all';
  
  /**
   * What to render if the user lacks permissions.
   * Defaults to null.
   */
  fallback?: ReactNode;
  
  children: ReactNode;
}

/**
 * A client-side component that conditionally renders its children
 * based on the user's permissions in the active organization.
 */
export function PermissionBoundary({
  permissions,
  mode = 'all',
  fallback = null,
  children,
}: PermissionBoundaryProps) {
  const permsArray = Array.isArray(permissions) ? permissions : [permissions];
  
  // We check each permission individually using the hook.
  // Note: Since hooks cannot be called inside loops/conditionals, 
  // we'll implement a slightly more robust logic.
  
  // But wait, usePermission is a hook that checks ONE permission.
  // I should probably have a usePermissions hook for multiple checks, 
  // or just use the session data directly here to avoid hook rule violations.
  
  // Let's implement the check logic directly using useSession 
  // to support multiple permissions efficiently.
  
  const hasPermissions = useCheckPermissions(permsArray, mode);

  if (!hasPermissions) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Internal helper to avoid hook rule violations and be efficient
import { useSession } from "@/lib/auth/client";
import { PERMISSIONS_METADATA_KEY } from "@/lib/auth/rbac-constants";

function useCheckPermissions(requiredPerms: PermissionKey[], mode: 'any' | 'all'): boolean {
  const { data: sessionData } = useSession();
  
  if (!sessionData?.session?.activeOrganizationId) return false;
  
  const sessionWithMeta = sessionData.session as typeof sessionData.session & { metadata?: Record<string, unknown> };
  const metadata = sessionWithMeta.metadata;
  const userPerms = ((metadata ? Reflect.get(metadata, PERMISSIONS_METADATA_KEY) : undefined) || []) as string[];
  
  if (mode === 'all') {
    return requiredPerms.every(p => userPerms.includes(p));
  } else {
    return requiredPerms.some(p => userPerms.includes(p));
  }
}
