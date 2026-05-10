"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRouter } from "@/i18n/routing";
import { 
  useListOrganizations, 
  authClient,
  useSession,
} from "@/lib/auth/client";
import { 
  createOrganizationAction 
} from "@/app/actions/org";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Building2, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

gsap.registerPlugin(useGSAP);

export default function SelecionarOrgPage() {
  const t = useTranslations("SelectOrg");
  const tOrg = useTranslations("Organization");
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const { data: orgs, isPending } = useListOrganizations();
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (isPending || !pageRef.current) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      // Ensure everything is visible if animations are disabled
      gsap.set(".org-logo, .org-heading, .org-card, .org-create-card", { 
        autoAlpha: 1, 
        y: 0, 
        scale: 1 
      });
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ 
        defaults: { 
          ease: "power3.out",
          duration: 0.5
        } 
      });

      tl.from(".org-logo", { autoAlpha: 0, scale: 0.8 })
        .from(".org-heading", { autoAlpha: 0, y: 20 }, "-=0.2")
        .from(".org-card", { 
          autoAlpha: 0, 
          y: 20, 
          stagger: 0.08,
          clearProps: "all"
        }, "-=0.3")
        .from(".org-create-card", { 
          autoAlpha: 0, 
          y: 20,
          clearProps: "all"
        }, "-=0.3");
    });

    return () => mm.revert();
  }, { scope: pageRef, dependencies: [isPending, orgs?.length] });

  useEffect(() => {
    if (!sessionPending && !session?.user) {
      router.replace("/login");
    }
  }, [sessionPending, session?.user, router]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const promise = (async () => {
      const result = await createOrganizationAction(newOrgName, newOrgSlug);
      
      if (!result.success) {
        if (result.error.toLowerCase().includes("session expired") || result.error.toLowerCase().includes("sessão expirada")) {
          router.push("/login");
        }
        throw new Error(result.error);
      }

      await authClient.organization.setActive({
        organizationId: result.organizationId
      });
      
      return result;
    })();

    toast.promise(promise, {
      loading: tOrg("creating"),
      success: (data: { slug: string }) => {
        router.push(`/org/${data.slug}/dashboard`);
        return tOrg("createdSuccess");
      },
      error: (err) => err.message || t("failedCreating"),
    });

    try {
      await promise;
    } catch {
      // Erro tratado pelo toast
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrg = async (orgId: string, slug: string) => {
    const promise = (async () => {
      await authClient.organization.setActive({
        organizationId: orgId
      });
      return slug;
    })();

    toast.promise(promise, {
      loading: t("opening"),
      success: (slug) => {
        router.push(`/org/${slug}/dashboard`);
        return t("welcome");
      },
      error: t("errorOpening"),
    });
  };

  const generateSlug = (name: string) => {
    setNewOrgName(name);
    setNewOrgSlug(name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""));
  };

  if (sessionPending || isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div ref={pageRef} className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="org-logo flex h-12 w-12 items-center justify-center rounded-lg bg-white mb-4">
            <span className="text-xl font-bold text-black">G</span>
          </div>
          <div className="org-heading">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              {t("title")}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              {t("subtitle")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* List existing orgs */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider px-1">
              {t("existing")}
            </h3>
            {orgs && orgs.length > 0 ? (
              <div className="space-y-3">
                {orgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleSelectOrg(org.id, org.slug)}
                    className="org-card w-full flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 group-hover:bg-zinc-700">
                        <Building2 className="h-5 w-5 text-zinc-400 group-hover:text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-white">{org.name}</p>
                        <p className="text-xs text-zinc-500">/{org.slug}</p>
                      </div>
                    </div>
                    <Check className="h-4 w-4 text-zinc-600 group-hover:text-white" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-zinc-800 text-center">
                <p className="text-sm text-zinc-600">{t("noneFound")}</p>
                <p className="text-xs text-zinc-500 mt-2">{t("createFirst")}</p>
              </div>
            )}
          </div>

          <Separator className="md:hidden bg-zinc-800" />

          {/* Create new org */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider px-1">
              {t("newOrganization")}
            </h3>
            <Card className="org-create-card border-zinc-800 bg-zinc-900/50">
              <CardHeader className="p-4 pt-6">
                <CardTitle className="text-lg">{t("createTenant")}</CardTitle>
                <CardDescription>
                  {t("configureWorkspace")}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleCreateOrg}>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">{t("companyName")}</Label>
                    <Input
                      id="orgName"
                      placeholder={t("companyPlaceholder")}
                      className="bg-zinc-950 border-zinc-800"
                      value={newOrgName}
                      onChange={(e) => generateSlug(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgSlug">{t("urlSlug")}</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-600 text-sm">/</span>
                      <Input
                        id="orgSlug"
                        placeholder={t("slugPlaceholder")}
                        className="bg-zinc-950 border-zinc-800 pl-6"
                        value={newOrgSlug}
                        onChange={(e) => setNewOrgSlug(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pb-6">
                  <Button 
                    type="submit" 
                    className="w-full bg-white text-black hover:bg-zinc-200"
                    isLoading={loading}
                    disabled={!newOrgName}
                  >
                    <Plus className="mr-2 h-4 w-4" /> {tOrg("createOrganization")}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
