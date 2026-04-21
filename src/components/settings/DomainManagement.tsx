"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Globe, CheckCircle2, AlertCircle, Trash2, ExternalLink, RefreshCw, Copy } from "lucide-react";
import { addDomainAction, removeDomainAction, checkDomainStatusAction } from "@/app/actions/domains";
import { useToast } from "@/hooks/use-toast";
import { usePaywall } from "@/components/billing/PaywallProvider";
import { motion } from "framer-motion";

interface DomainManagementProps {
  orgId: string;
  initialDomain: string | null;
  initialVerified: boolean;
  hasCustomDomainPlan: boolean;
}

export function DomainManagement({ 
  orgId, 
  initialDomain, 
  initialVerified,
  hasCustomDomainPlan 
}: DomainManagementProps) {
  const [domain, setDomain] = useState(initialDomain || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [verified, setVerified] = useState(initialVerified);
  
  const { toast } = useToast();
  const { openPaywall } = usePaywall();

  const handleAddDomain = async () => {
    if (!hasCustomDomainPlan) {
      openPaywall({
        title: "Domínios Customizados",
        reason: "Domínios customizados são exclusivos para assinantes do plano Pro.",
        requiredPlan: "pro"
      });
      return;
    }

    if (!domain) return;
    
    setIsVerifying(true);
    try {
      const result = await addDomainAction(orgId, domain);
      if (result?.error) {
        toast({
          title: "Erro ao adicionar domínio",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Domínio adicionado",
          description: "Agora configure os registros DNS para verificar a propriedade.",
        });
        window.location.reload(); // Refresh to get new state
      }
    } catch {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!confirm("Tem certeza que deseja remover este domínio? Isso interromperá o acesso via URL customizada.")) return;
    
    setIsRemoving(true);
    try {
      await removeDomainAction(orgId);
      toast({
        title: "Domínio removido",
        description: "O mapeamento de domínio foi excluído com sucesso.",
      });
      window.location.reload();
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      const status = await checkDomainStatusAction(orgId);
      if (status?.isValid) {
        setVerified(true);
        toast({
          title: "Domínio verificado!",
          description: "Sua configuração DNS está correta e o SSL foi provisionado.",
        });
      } else {
        toast({
          title: "Ainda não verificado",
          description: "Aguarde a propagação do DNS ou verifique seus registros.",
          variant: "destructive",
        });
      }
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "Copiado para a área de transferência" });
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
              <CardTitle className="text-xl">Domínio Customizado</CardTitle>
              <CardDescription>
                Conecte seu próprio domínio para uma experiência de marca profissional.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {!initialDomain ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="exemplo.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value.toLowerCase())}
                  className="max-w-md h-11"
                />
                <Button 
                  onClick={handleAddDomain} 
                  disabled={isVerifying || !domain}
                  className="h-11 px-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
                >
                  {isVerifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Conectar Domínio
                </Button>
              </div>
              <p className="text-sm text-zinc-500">
                Você precisará configurar registros CNAME ou A no seu provedor de DNS.
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
                          <CheckCircle2 className="h-3 w-3" /> Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 gap-1 px-2 py-0.5">
                          <AlertCircle className="h-3 w-3" /> Pendente
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCheckStatus} disabled={isChecking}>
                    {isChecking ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Verificar DNS
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleRemoveDomain} disabled={isRemoving} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                    {isRemoving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Remover
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
                    <AlertTitle className="text-amber-800 dark:text-amber-400">Configuração DNS Requerida</AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-500">
                      Adicione um dos registros abaixo no seu provedor de DNS (Cloudflare, GoDaddy, etc) para ativar seu domínio.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-zinc-500">Opção 1: CNAME (Recomendado)</span>
                        <Badge>Record</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Tipo</span>
                          <span className="font-mono">CNAME</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Nome</span>
                          <span className="font-mono">www (ou @)</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800">
                          <span className="font-mono text-xs">cname.vercel-dns.com</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard("cname.vercel-dns.com")}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-zinc-500">Opção 2: Registro A</span>
                        <Badge variant="outline">Apex Domain</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Tipo</span>
                          <span className="font-mono">A</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Nome</span>
                          <span className="font-mono">@</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800">
                          <span className="font-mono text-xs">76.76.21.21</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard("76.76.21.21")}>
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
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-400">Domínio Ativo e Seguro</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-0.5">
                      Seu site está agora acessível via HTTPS em {initialDomain}.
                    </p>
                    <a 
                      href={`https://${initialDomain}`} 
                      target="_blank" 
                      className="inline-flex items-center text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline mt-2"
                    >
                      Acessar Site <ExternalLink className="ml-1 h-3 w-3" />
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
