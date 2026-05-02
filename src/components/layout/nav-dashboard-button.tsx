"use client";

import { useSession, useListOrganizations } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Loader2, LayoutDashboard } from "lucide-react";
import Link from "next/link";

import { useTranslations } from "next-intl";

export function NavDashboardButton() {
  const t = useTranslations("Navigation");
  const { data: session, isPending: sessionPending } = useSession();
  const { data: orgs, isPending: orgsPending } = useListOrganizations();

  const isPending = sessionPending || orgsPending;

  if (isPending) {
    return (
      <Button variant="outline" disabled className="bg-white/5 border-white/10 text-white/50 gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t("dashboard")}
      </Button>
    );
  }

  // Determine destination
  let destination = "/login";
  
  if (session?.user) {
    if (orgs && orgs.length > 0) {
      // If they have orgs, the first one is a good default, 
      // but ideally we'd use the active one from Better-Auth if available.
      // For now, redirecting to selection or first org is safer than a mock page.
      destination = orgs.length === 1 ? `/org/${orgs[0].slug}/dashboard` : "/selecionar-org";
    } else {
      destination = "/selecionar-org";
    }
  }

  return (
    <Button 
      className="bg-white text-zinc-950 hover:bg-zinc-200 transition-all font-bold"
      render={<Link href={destination} />}
      nativeButton={false}
    >
      <LayoutDashboard className="w-4 h-4" />
      {t("goToDashboard")}
    </Button>
  );
}
