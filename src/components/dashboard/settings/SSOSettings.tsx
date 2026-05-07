"use client";

import { useState } from "react";
import { Globe, CheckCircle2, Copy, Trash2, RefreshCw, Info, ExternalLink, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { addDomainAction, verifyDomainAction, deleteDomainAction, updateSSOConfigAction } from "@/app/actions/sso";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

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
    setVerifyingId(id);
    try {
      const res = await verifyDomainAction(organizationId, id);
      if (res.success) {
        toast.success("Domínio verificado com sucesso!");
      } else {
        toast.error("Registro TXT não encontrado. A propagação do DNS pode levar alguns minutos.", {
          icon: <AlertCircle className="h-4 w-4 text-amber-500" />
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message);
    } finally {
      setVerifyingId(null);
    }
  };

  const onDeleteDomain = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este domínio? Isso desabilitará o SSO para usuários deste domínio.")) return;
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
      toast.success(`Configuração de ${providerId === 'google' ? 'Google' : 'Microsoft'} atualizada.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-8 max-w-5xl mx-auto pb-10">
        <div className="space-y-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-2"
          >
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold">
              Enterprise Grade
            </Badge>
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Security & SSO</h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Configure o Single Sign-On (SAML/OIDC) e gerencie domínios verificados para garantir que sua empresa mantenha o controle total sobre o acesso.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Domain Management */}
          <Card className="border-zinc-800 bg-zinc-950/40 backdrop-blur-md shadow-2xl overflow-hidden border-t-zinc-700/50">
            <CardHeader className="pb-4 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-400" />
                    Domínios Corporativos
                  </CardTitle>
                  <CardDescription className="text-zinc-500">
                    Verifique a propriedade para habilitar Provisionamento Automático (JIT).
                  </CardDescription>
                </div>
                <div className="hidden sm:block">
                  <Tooltip>
                    <TooltipTrigger>
                      <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-zinc-400">
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-zinc-900 border-zinc-800 text-zinc-300">
                      Domínios verificados permitem que usuários com o e-mail correspondente entrem automaticamente na organização via SSO.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 p-1.5 rounded-2xl bg-zinc-900/30 border border-zinc-800 focus-within:border-zinc-600 focus-within:bg-zinc-900/50 transition-all">
                <Input 
                  placeholder="ex: acme.com" 
                  className="bg-transparent border-none focus-visible:ring-0 shadow-none h-11 text-zinc-200 placeholder:text-zinc-600 text-base"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onAddDomain()}
                />
                <Button 
                  onClick={onAddDomain} 
                  disabled={loading || !newDomain} 
                  className="rounded-xl h-11 px-6 bg-white text-black hover:bg-zinc-200 font-semibold shadow-lg shadow-white/5 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Adicionar Domínio"}
                </Button>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {domains.map((domain, index) => (
                    <motion.div 
                      key={domain.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="group relative flex flex-col p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:border-zinc-700/50 hover:bg-zinc-900/40 transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${domain.isVerified ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                            <Globe className={`h-5 w-5 ${domain.isVerified ? 'text-emerald-400' : 'text-amber-400'}`} />
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-bold text-white text-lg tracking-tight">{domain.domain}</span>
                            <div className="flex items-center gap-2">
                              {domain.isVerified ? (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-1.5 py-0">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Verificado
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 px-1.5 py-0">
                                  <RefreshCw className="h-3 w-3 mr-1" /> Aguardando DNS
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!domain.isVerified && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => onVerifyDomain(domain.id)} 
                              disabled={!!verifyingId}
                              className="bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 border-zinc-700 h-9 px-4 rounded-lg"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${verifyingId === domain.id ? 'animate-spin text-amber-400' : ''}`} />
                              {verifyingId === domain.id ? 'Verificando...' : 'Verificar agora'}
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" 
                            onClick={() => onDeleteDomain(domain.id)} 
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {!domain.isVerified && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-5 space-y-3 pt-5 border-t border-zinc-800/50"
                        >
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Configuração DNS Necessária
                          </div>
                          <p className="text-sm text-zinc-400 leading-relaxed">
                            Adicione o seguinte registro TXT nas configurações de DNS do seu domínio (ex: Cloudflare, AWS Route53, GoDaddy).
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-1 space-y-1">
                              <Label className="text-[10px] text-zinc-500 uppercase font-bold">Tipo</Label>
                              <div className="h-10 px-3 flex items-center rounded-lg bg-zinc-950 border border-zinc-800 text-sm font-mono text-blue-400">TXT</div>
                            </div>
                            <div className="md:col-span-1 space-y-1">
                              <Label className="text-[10px] text-zinc-500 uppercase font-bold">Host / Nome</Label>
                              <div className="h-10 px-3 flex items-center rounded-lg bg-zinc-950 border border-zinc-800 text-sm font-mono text-zinc-300">@ <span className="text-zinc-600 ml-1">(ou vazio)</span></div>
                            </div>
                            <div className="md:col-span-2 space-y-1">
                              <Label className="text-[10px] text-zinc-500 uppercase font-bold">Valor / Conteúdo</Label>
                              <div className="relative group/token">
                                <div className="h-10 pl-3 pr-10 flex items-center rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 overflow-hidden text-ellipsis whitespace-nowrap">
                                  gravity-verification={domain.verificationToken}
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="absolute right-1 top-1 h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-800"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`gravity-verification=${domain.verificationToken}`);
                                    toast.success("Valor copiado!");
                                  }}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {domains.length === 0 && (
                  <div className="text-center py-16 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10">
                    <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                      <Globe className="h-8 w-8 text-zinc-700" />
                    </div>
                    <h3 className="text-zinc-400 font-semibold mb-1">Nenhum domínio</h3>
                    <p className="text-zinc-600 text-sm max-w-xs mx-auto">
                      Adicione seu domínio corporativo para começar a configurar o login único.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* IdP Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Google */}
            <Card className="border-zinc-800 bg-zinc-950/40 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col group/card border-t-zinc-700/50">
              <CardHeader className="pb-4 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-white/5 group-hover/card:scale-110 transition-transform duration-500">
                    <svg viewBox="0 0 24 24" className="h-7 w-7">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${googleConfig.isActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {googleConfig.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    <Switch 
                      checked={googleConfig.isActive} 
                      onCheckedChange={(val) => onUpdateConfig("google", googleConfig, "isActive", val)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Google Workspace</CardTitle>
                <CardDescription className="text-zinc-400 flex items-center gap-2">
                  OpenID Connect (OIDC) 
                  <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 inline-flex items-center">
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 flex-grow pt-2">
                <div className="space-y-2 group/input">
                  <div className="flex items-center justify-between">
                    <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Client ID</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="h-3.5 w-3.5 text-zinc-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-900 border-zinc-800 text-xs">
                        ID gerado no Google Cloud Console em APIs & Services &gt; Credentials
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input 
                    placeholder="xxxxxx-xxxxxxxx.apps.googleusercontent.com"
                    className="bg-zinc-900/50 border-zinc-800 text-sm focus:border-blue-500/40 focus:bg-zinc-900 transition-all h-10 rounded-xl"
                    defaultValue={googleConfig.clientId}
                    onBlur={(e) => onUpdateConfig("google", googleConfig, "clientId", e.target.value)}
                  />
                </div>
                <div className="space-y-2 group/input">
                  <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Client Secret</Label>
                  <Input 
                    type="password"
                    placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                    className="bg-zinc-900/50 border-zinc-800 text-sm focus:border-blue-500/40 focus:bg-zinc-900 transition-all h-10 rounded-xl"
                    defaultValue={googleConfig.clientSecret || ""}
                    onBlur={(e) => onUpdateConfig("google", googleConfig, "clientSecret", e.target.value)}
                  />
                </div>
                <div className="pt-4 mt-auto">
                  <p className="text-[10px] text-zinc-500 italic">
                    * Requer que o e-mail do usuário pertença a um domínio verificado.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Microsoft */}
            <Card className="border-zinc-800 bg-zinc-950/40 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col group/card border-t-zinc-700/50">
              <CardHeader className="pb-4 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#00a4ef] flex items-center justify-center shadow-xl shadow-blue-500/10 group-hover/card:scale-110 transition-transform duration-500">
                    <svg viewBox="0 0 23 23" className="h-7 w-7">
                      <path fill="#f35325" d="M1 1h10v10H1z" />
                      <path fill="#81bc06" d="M12 1h10v10H12z" />
                      <path fill="#05a6f0" d="M1 12h10v10H1z" />
                      <path fill="#ffba08" d="M12 12h10v10H12z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${microsoftConfig.isActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {microsoftConfig.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    <Switch 
                      checked={microsoftConfig.isActive}
                      onCheckedChange={(val) => onUpdateConfig("microsoft-entra-id", microsoftConfig, "isActive", val)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Microsoft Entra ID</CardTitle>
                <CardDescription className="text-zinc-400 flex items-center gap-2">
                  Azure Active Directory
                  <a href="https://portal.azure.com/" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 inline-flex items-center">
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 flex-grow pt-2">
                <div className="space-y-2 group/input">
                  <div className="flex items-center justify-between">
                    <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Application (Client) ID</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="h-3.5 w-3.5 text-zinc-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-900 border-zinc-800 text-xs">
                        UUID encontrado no Overview da sua App Registration no Portal Azure.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input 
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="bg-zinc-900/50 border-zinc-800 text-sm focus:border-blue-500/40 focus:bg-zinc-900 transition-all h-10 rounded-xl font-mono"
                    defaultValue={microsoftConfig.clientId}
                    onBlur={(e) => onUpdateConfig("microsoft-entra-id", microsoftConfig, "clientId", e.target.value)}
                  />
                </div>
                <div className="space-y-2 group/input">
                  <div className="flex items-center justify-between">
                    <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Issuer / Directory (Tenant) ID</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="h-3.5 w-3.5 text-zinc-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-900 border-zinc-800 text-xs">
                        O ID do seu tenant Azure AD ou a URL completa do emissor STS.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input 
                    placeholder="https://sts.windows.net/tenant-id/"
                    className="bg-zinc-900/50 border-zinc-800 text-sm focus:border-blue-500/40 focus:bg-zinc-900 transition-all h-10 rounded-xl font-mono"
                    defaultValue={microsoftConfig.issuer || ""}
                    onBlur={(e) => onUpdateConfig("microsoft-entra-id", microsoftConfig as SSOConfig, "issuer", e.target.value)}
                  />
                </div>
                <div className="pt-4 mt-auto">
                  <p className="text-[10px] text-zinc-500 italic">
                    * Verifique se o domínio do seu tenant Microsoft corresponde a um domínio verificado acima.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Policy Notice */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex gap-5 items-start shadow-xl shadow-emerald-500/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <ShieldCheck className="h-24 w-24 text-emerald-500" />
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="relative z-10">
              <h4 className="text-lg font-bold text-white mb-1">Strict Organizational Security Enforced</h4>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                Nossa política de segurança garante que o acesso via SSO seja restrito. Usuários só serão provisionados se o domínio do e-mail estiver <span className="text-emerald-400 font-semibold underline underline-offset-4 decoration-emerald-500/30">verificado</span> ou se possuírem um <span className="text-emerald-400 font-semibold underline underline-offset-4 decoration-emerald-500/30">convite pendente</span>. Isso evita o acesso não autorizado de domínios públicos ou não gerenciados.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
}
