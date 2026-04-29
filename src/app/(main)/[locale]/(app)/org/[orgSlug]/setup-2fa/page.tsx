"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { TwoFactorSetup } from "@/components/security/two-factor-setup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, LogOut, LayoutGrid, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

export default function Setup2FAInterstitial() {
   const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const t = useTranslations("Compliance");
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    tl.from(".reveal-icon", {
      scale: 0.5,
      opacity: 0,
      duration: 0.8,
      ease: "elastic.out(1, 0.5)"
    })
    .from(".reveal-text", {
      y: 20,
      opacity: 0,
      stagger: 0.2,
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.4")
    .from(".reveal-card", {
      y: 40,
      opacity: 0,
      stagger: 0.15,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.6");
  }, { scope: containerRef });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/login");
          },
        },
      });
    } catch {
      toast.error("Failed to sign out");
      setIsLoggingOut(false);
    }
  };

   return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 px-6 py-12 backdrop-blur-sm">
      <div className="w-full max-w-2xl space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="reveal-icon flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <ShieldAlert className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h2 className="reveal-text text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {t("title")}
            </h2>
            <p className="reveal-text text-zinc-400 max-w-md mx-auto">
              {t("description")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="reveal-card bg-zinc-900/50 border-zinc-800 shadow-2xl flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-100 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-emerald-500" />
                {t("setupTitle")}
              </CardTitle>
              <CardDescription className="text-zinc-500">
                {t("setupDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <TwoFactorSetup onEnabled={() => {
                toast.success(t("onEnabledSuccess"));
                router.push(`/org/${orgSlug}/dashboard`);
                router.refresh();
              }} />
            </CardContent>
          </Card>

          <Card className="reveal-card bg-zinc-900/20 border-zinc-800/50 border-dashed flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-400">
                {t("notReady")}
              </CardTitle>
              <CardDescription className="text-zinc-500">
                {t("notReadyDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 mt-auto">
              <Link 
                href="/selecionar-org"
                className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-800 bg-transparent px-2.5 h-8 text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-all"
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                {t("switchOrg")}
              </Link>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full text-zinc-500 hover:text-red-400 hover:bg-red-500/5"
              >
                {isLoggingOut ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                {t("signOut")}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-xs text-zinc-600">
            {t("lostAccess")}
          </p>
        </div>
      </div>
    </div>
  );
}
