"use client";

import { useState } from "react";
import { Globe, CheckCircle2, Copy, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { addDomainAction, verifyDomainAction, deleteDomainAction, updateSSOConfigAction } from "@/app/actions/sso";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";

interface Domain {
  id: string;
  domain: string;
  isVerified: boolean;
  verificationToken: string;
}

interface SSOConfig {
  providerId: string;
  clientId: string;
  clientSecret?: string | null;
  issuer?: string | null;
  isActive: boolean;
}

interface SSOSettingsProps {
  organizationId: string;
  domains: Domain[];
  ssoConfigs: SSOConfig[];
}

export function SSOSettings({ organizationId, domains, ssoConfigs }: SSOSettingsProps) {
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(false);

  // SSO Config states
  const googleConfig = ssoConfigs.find(c => c.providerId === "google") || { providerId: "google", clientId: "", clientSecret: "", isActive: false };
  const microsoftConfig = ssoConfigs.find(c => c.providerId === "microsoft-entra-id") || { providerId: "microsoft-entra-id", clientId: "", clientSecret: "", issuer: "", isActive: false };

  const onAddDomain = async () => {
    if (!newDomain) return;
    setLoading(true);
    try {
      await addDomainAction(organizationId, newDomain);
      setNewDomain("");
      toast.success("Domínio adicionado. Verifique os registros DNS.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyDomain = async (id: string) => {
    setLoading(true);
    try {
      const res = await verifyDomainAction(organizationId, id);
      if (res.success) {
        toast.success("Domínio verificado com sucesso!");
      } else {
        toast.error("Registro TXT não encontrado ou incorreto.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onDeleteDomain = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este domínio?")) return;
    setLoading(true);
    try {
      await deleteDomainAction(organizationId, id);
      toast.success("Domínio removido.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onUpdateConfig = async (providerId: string, current: SSOConfig, field: keyof SSOConfig, value: string | boolean) => {
    try {
      const newData = { ...current, [field]: value };
      await updateSSOConfigAction(organizationId, {
        providerId,
        clientId: newData.clientId,
        clientSecret: newData.clientSecret || undefined,
        issuer: newData.issuer || undefined,
        isActive: newData.isActive,
      });
      toast.success(`Configuração de ${providerId} atualizada.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Enterprise SSO</h1>
        <p className="text-zinc-400">
          Gerencie a autenticação centralizada e o provisionamento automático de usuários para sua organização.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Domain Management */}
        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm shadow-xl overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-400" />
              Domínios Corporativos
            </CardTitle>
            <CardDescription>
              Verifique a propriedade do domínio para habilitar o login via SSO e o provisionamento Just-In-Time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2 p-1 rounded-xl bg-zinc-900/50 border border-zinc-800 focus-within:border-zinc-700 transition-colors">
              <Input 
                placeholder="exemplo.com" 
                className="bg-transparent border-none focus-visible:ring-0 shadow-none h-10"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
              <Button onClick={onAddDomain} disabled={loading} className="rounded-lg h-10 bg-white text-black hover:bg-zinc-200">
                Adicionar Domínio
              </Button>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {domains.map((domain, index) => (
                  <motion.div 
                    key={domain.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="group relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-white text-lg">{domain.domain}</span>
                        {domain.isVerified ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Verificado
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                            <RefreshCw className="h-3 w-3 mr-1" /> Pendente
                          </Badge>
                        )}
                      </div>
                      
                      {!domain.isVerified && (
                        <div className="space-y-2 p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/50">
                          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">DNS Configuration (TXT Record)</p>
                          <div className="flex items-center justify-between gap-3">
                            <code className="text-xs text-zinc-300 break-all">gravity-verification={domain.verificationToken}</code>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 shrink-0 text-zinc-500 hover:text-white"
                              onClick={() => {
                                navigator.clipboard.writeText(`gravity-verification=${domain.verificationToken}`);
                                toast.success("Copiado para o clipboard");
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-800/50">
                      {!domain.isVerified && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => onVerifyDomain(domain.id)} 
                          disabled={loading}
                          className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                          Verificar DNS
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" 
                        onClick={() => onDeleteDomain(domain.id)} 
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {domains.length === 0 && (
                <div className="text-center py-12 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20">
                  <Globe className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">Nenhum domínio configurado ainda.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* IdP Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google */}
          <Card className="border-zinc-800 bg-zinc-950/50 shadow-xl overflow-hidden flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 24 24" className="h-6 w-6">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <Switch 
                  checked={googleConfig.isActive} 
                  onCheckedChange={(val) => onUpdateConfig("google", googleConfig, "isActive", val)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
              <CardTitle className="text-lg">Google Workspace</CardTitle>
              <CardDescription>OpenID Connect (OIDC)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
              <div className="space-y-2">
                <Label className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Client ID</Label>
                <Input 
                  placeholder="ID do cliente Google"
                  className="bg-zinc-900/50 border-zinc-800 text-sm focus:border-blue-500/50 transition-colors"
                  defaultValue={googleConfig.clientId}
                  onBlur={(e) => onUpdateConfig("google", googleConfig, "clientId", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Client Secret</Label>
                <Input 
                  type="password"
                  placeholder="••••••••••••"
                  className="bg-zinc-900/50 border-zinc-800 text-sm focus:border-blue-500/50 transition-colors"
                  defaultValue={googleConfig.clientSecret || ""}
                  onBlur={(e) => onUpdateConfig("google", googleConfig, "clientSecret", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Microsoft */}
          <Card className="border-zinc-800 bg-zinc-950/50 shadow-xl overflow-hidden flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-10 w-10 rounded-xl bg-[#00a4ef] flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 23 23" className="h-6 w-6">
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                </div>
                <Switch 
                  checked={microsoftConfig.isActive}
                  onCheckedChange={(val) => onUpdateConfig("microsoft-entra-id", microsoftConfig, "isActive", val)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
              <CardTitle className="text-lg">Microsoft Entra ID</CardTitle>
              <CardDescription>SAML / OIDC</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
              <div className="space-y-2">
                <Label className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Application ID</Label>
                <Input 
                  placeholder="ID da aplicação Azure"
                  className="bg-zinc-900/50 border-zinc-800 text-sm focus:border-blue-500/50 transition-colors"
                  defaultValue={microsoftConfig.clientId}
                  onBlur={(e) => onUpdateConfig("microsoft-entra-id", microsoftConfig, "clientId", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Issuer / Tenant ID</Label>
                <Input 
                  placeholder="Ex: https://sts.windows.net/tenant-id/"
                  className="bg-zinc-900/50 border-zinc-800 text-sm focus:border-blue-500/50 transition-colors"
                  defaultValue={microsoftConfig.issuer || ""}
                  onBlur={(e) => onUpdateConfig("microsoft-entra-id", microsoftConfig as SSOConfig, "issuer", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* JIT Provisioning Notice */}
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex gap-4 items-start shadow-sm shadow-blue-500/5">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <CheckCircle2 className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Just-In-Time Provisioning Habilitado</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Novos usuários que fizerem login via SSO com um domínio verificado serão automaticamente adicionados como membros desta organização com a role <span className="text-zinc-300 font-medium italic">&quot;member&quot;</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
