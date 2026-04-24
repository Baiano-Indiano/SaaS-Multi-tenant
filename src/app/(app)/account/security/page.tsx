"use client";

import { authClient } from "@/lib/auth/client";
import { TwoFactorStatus } from "@/components/security/two-factor-status";
import { TwoFactorSetup, DisableTwoFactor } from "@/components/security/two-factor-setup";
import { SessionsList } from "@/components/security/sessions-list";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function SecurityPage() {
  const { data: session, isPending, refetch } = authClient.useSession();
  
  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full bg-zinc-800/50" />
        <Skeleton className="h-20 w-full bg-zinc-800/50" />
      </div>
    );
  }

  const user = session?.user as NonNullable<typeof session>["user"] & { twoFactorEnabled?: boolean };
  const is2FAEnabled = !!user?.twoFactorEnabled;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-zinc-100">Security Settings</h3>
        <p className="text-sm text-zinc-400">
          Manage your account security and authentication methods.
        </p>
      </div>
      
      <Separator className="bg-zinc-800" />
      
      <div className="space-y-8">
        <TwoFactorStatus enabled={is2FAEnabled} />
        
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-base font-semibold text-zinc-200">
                Authenticator App
              </h4>
              <p className="text-sm text-zinc-500">
                Use an app like Google Authenticator or 1Password to generate one-time codes.
              </p>
            </div>
            {is2FAEnabled ? (
              <DisableTwoFactor onDisabled={() => refetch()} />
            ) : (
              <TwoFactorSetup onEnabled={() => refetch()} />
            )}
          </div>
        </div>

        <Separator className="bg-zinc-800" />
        
        <SessionsList />
      </div>
    </div>
  );
}
