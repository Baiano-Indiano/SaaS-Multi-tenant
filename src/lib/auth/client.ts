import { createAuthClient } from "better-auth/react"
import { organizationClient, twoFactorClient, multiSessionClient } from "better-auth/client/plugins"
import { ssoClient } from "@better-auth/sso/client"
import { PermissionKey } from "./permissions"
import { PERMISSIONS_METADATA_KEY } from "./rbac-constants"

interface AuthSession {
  session: {
    id: string;
    userId: string;
    activeOrganizationId?: string | null;
    metadata?: Record<string, unknown> | null;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    organizationClient(),
    twoFactorClient({
      onTwoFactorRedirect: () => {
        window.location.href = "/verify-2fa";
      },
    }),
    multiSessionClient(),
    ssoClient(),
  ]
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
  useListOrganizations,
  useActiveOrganization,
  twoFactor,
  multiSession,
  sso,
} = authClient;

/**
 * Client-side hook to check if the user has a specific permission
 * in the active organization context.
 */
export function usePermission(permission: PermissionKey): boolean {
  const sessionResult = useSession() as unknown as { data: AuthSession | null };
  const session = sessionResult.data;
  
  if (!session?.session?.activeOrganizationId) return false;
  
  const metadata = session.session.metadata;
  const permissions = (metadata?.[PERMISSIONS_METADATA_KEY] || []) as string[];
  
  return permissions.includes(permission);
}
