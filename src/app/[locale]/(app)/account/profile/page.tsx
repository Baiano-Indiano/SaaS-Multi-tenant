"use client";

import { authClient } from "@/lib/auth/client";
import { UserProfileForm } from "@/components/account/UserProfileForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full bg-zinc-900/50 border border-zinc-800" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <UserProfileForm user={session.user} />
    </div>
  );
}
