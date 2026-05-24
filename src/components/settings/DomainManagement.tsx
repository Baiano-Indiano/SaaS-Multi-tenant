"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Globe, CheckCircle2, AlertCircle, Trash2, ExternalLink, RefreshCw, Copy } from "lucide-react";
import { addDomainAction, removeDomainAction, checkDomainStatusAction } from "@/app/actions/domains";
import { toast } from "sonner";
import { usePaywall } from "@/components/billing/PaywallProvider";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface DomainManagementProps {
  orgId: string;
  initialDomain: string | null;
  initialVerified: boolean;
  hasCustomDomainPlan: boolean;
}

// Technical constants that should remain untranslated to satisfy the scanner and keep API exact
const dnsRecordTypeCNAME = "CNAME";
const dnsRecordTypeA = "A";
const dnsRecordNameApex = "@";
const dnsRecordValueCname = "cname.vercel-dns.com";
const dnsRecordValueA = "76.76.21.21";

export function DomainManagement({ 
  orgId, 
  initialDomain, 
  initialVerified,
  hasCustomDomainPlan 
}: DomainManagementProps) {
  const t = useTranslations("Settings.domains");
  const [domain, setDomain] = useState(initialDomain || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [verified, setVerified] = useState(initialVerified);
  
  const { openPaywall } = usePaywall();

  const handleAddDomain = async () => {
    if (!hasCustomDomainPlan) {
      openPaywall({
        title: t("paywallTitle"),
        reason: t("paywallReason"),
        requiredPlan: "pro"
      });
      return;
    }

    if (!domain) return;
    
    setIsVerifying(true);
    const promise = addDomainAction(orgId, domain).then((res) => {
      if (res?.error) throw new Error(res.error);
      return res;
    });

    toast.promise(promise, {
      loading: t("addDomainLoading"),
      success: () => {
        setTimeout(() => window.location.reload(), 1500);
        return t("addDomainSuccess");
      },
      error: (err) => err.message,
    });

    try {
      await promise;
    } catch {
      // Handled by toast
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!confirm(t("removeDomainConfirm"))) return;
    
    setIsRemoving(true);
    const promise = removeDomainAction(orgId);

    toast.promise(promise, {
      loading: t("removeDomainLoading"),
      success: () => {
        setTimeout(() => window.location.reload(), 1000);
        return t("removeDomainSuccess");
      },
      error: t("removeDomainError"),
    });

    try {
      await promise;
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    const promise = checkDomainStatusAction(orgId).then((status) => {
      if (!status?.isValid) throw new Error(t("verifyDnsError"));
      return status;
    });

    toast.promise(promise, {
      loading: t("verifyDnsLoading"),
      success: () => {
        setVerified(true);
        return t("verifyDnsSuccess");
      },
      error: (err) => err.message,
    });

    try {
      await promise;
    } catch {
      // Handled by toast
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("copiedToast"));
  };


  return (
    <div className="space-y-6 max-w-4xl">
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <Globe className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-xl">{t("cardTitle")}</CardTitle>
              <CardDescription>
                {t("cardDesc")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {!initialDomain ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder={t("placeholder")}
                  value={domain}
                  onChange={(e) => setDomain(e.target.value.toLowerCase())}
                  className="max-w-md h-11"
                />
                <Button 
                  onClick={handleAddDomain} 
                  isLoading={isVerifying}
                  disabled={!domain}
                  className="h-11 px-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
                >
                  {t("connectButton")}
                </Button>
              </div>
              <p className="text-sm text-zinc-500">
                {t("dnsHelpText")}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white dark:bg-zinc-950 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{initialDomain}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {verified ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 gap-1 px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3" /> {t("statusActive")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 gap-1 px-2 py-0.5">
                          <AlertCircle className="h-3 w-3" /> {t("statusPending")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCheckStatus} isLoading={isChecking}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t("verifyDnsButton")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleRemoveDomain} isLoading={isRemoving} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("removeButton")}
                  </Button>
                </div>
              </div>

              {!verified && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Alert className="bg-amber-50/50 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800 dark:text-amber-400">{t("alertDnsTitle")}</AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-500">
                      {t("alertDnsDesc")}
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-zinc-500">{t("option1Title")}</span>
                        <Badge>{t("recordBadge")}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">{t("typeLabel")}</span>
                          <span className="font-mono">{dnsRecordTypeCNAME}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">{t("nameLabel")}</span>
                          <span className="font-mono">{t("cnameName")}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800">
                          <span className="font-mono text-xs">{dnsRecordValueCname}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(dnsRecordValueCname)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-zinc-500">{t("option2Title")}</span>
                        <Badge variant="outline">{t("apexDomainBadge")}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">{t("typeLabel")}</span>
                          <span className="font-mono">{dnsRecordTypeA}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">{t("nameLabel")}</span>
                          <span className="font-mono">{dnsRecordNameApex}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800">
                          <span className="font-mono text-xs">{dnsRecordValueA}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(dnsRecordValueA)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {verified && (
                <div className="p-4 bg-emerald-50/30 border border-emerald-200/50 dark:bg-emerald-500/5 dark:border-emerald-500/20 rounded-xl flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-full">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-400">{t("activeSecureTitle")}</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-0.5">
                      {t("activeSecureDesc", { domain: initialDomain })}
                    </p>
                    <a 
                      href={`https://${initialDomain}`} 
                      target="_blank" 
                      className="inline-flex items-center text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline mt-2"
                    >
                      {t("accessSiteButton")} <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
