"use client";

import { useState } from "react";
import { 
  Activity, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  upsertStatusComponentAction, 
  deleteStatusComponentAction, 
  createStatusIncidentAction 
} from "@/app/actions/status";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Component {
  id: string;
  name: string;
  description: string | null;
  status: "operational" | "degraded" | "partial_outage" | "major_outage";
  isActive: boolean;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  createdAt: Date;
}

interface StatusSettingsProps {
  organizationId: string;
  orgSlug: string;
  components: Component[];
  incidents: Incident[];
}

export function StatusSettings({ organizationId, orgSlug, components, incidents }: StatusSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false);
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);

  // Form states
  const [editingComponent, setEditingComponent] = useState<Partial<Component> | null>(null);
  const [newIncident, setNewIncident] = useState<{
    title: string;
    description: string;
    status: Incident["status"];
    severity: Incident["severity"];
  }>({
    title: "",
    description: "",
    status: "investigating",
    severity: "minor",
  });

  const onUpsertComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComponent?.name) return;

    setLoading(true);
    try {
      await upsertStatusComponentAction({
        organizationId,
        id: editingComponent.id,
        name: editingComponent.name,
        description: editingComponent.description || undefined,
        status: editingComponent.status || "operational",
        isActive: editingComponent.isActive ?? true,
      });
      toast.success(editingComponent.id ? "Componente atualizado" : "Componente criado");
      setIsComponentDialogOpen(false);
      setEditingComponent(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const onDeleteComponent = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este componente?")) return;

    setLoading(true);
    try {
      await deleteStatusComponentAction({ organizationId, id });
      toast.success("Componente removido");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    } finally {
      setLoading(false);
    }
  };

  const onCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createStatusIncidentAction({
        organizationId,
        ...newIncident,
      });
      toast.success("Incidente registrado");
      setIsIncidentDialogOpen(false);
      setNewIncident({ title: "", description: "", status: "investigating", severity: "minor" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "degraded": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "partial_outage": return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      case "major_outage": return "text-red-400 bg-red-400/10 border-red-400/20";
      default: return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "operational": return "Operacional";
      case "degraded": return "Performance Degradada";
      case "partial_outage": return "Instabilidade Parcial";
      case "major_outage": return "Instabilidade Crítica";
      default: return status;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header com Link Público */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Status Page Pública</h3>
            <p className="text-sm text-zinc-400">Comunique incidentes e saúde do sistema aos seus clientes.</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:text-white"
          onClick={() => window.open(`/status/${orgSlug}`, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Ver Página Pública
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Componentes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Componentes do Sistema</h4>
            <Dialog open={isComponentDialogOpen} onOpenChange={setIsComponentDialogOpen}>
              <DialogTrigger render={
                <Button size="sm" className="bg-white text-black hover:bg-zinc-200" onClick={() => setEditingComponent({})}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Componente
                </Button>
              } />
              <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                  <DialogTitle>{editingComponent?.id ? "Editar Componente" : "Novo Componente"}</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Componentes são exibidos individualmente na sua página de status.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={onUpsertComponent} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome do Componente</Label>
                    <Input 
                      placeholder="Ex: API, Dashboard, Banco de Dados" 
                      className="bg-zinc-900 border-zinc-800"
                      value={editingComponent?.name || ""}
                      onChange={(e) => setEditingComponent(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição (Opcional)</Label>
                    <Input 
                      placeholder="Breve descrição da função deste componente" 
                      className="bg-zinc-900 border-zinc-800"
                      value={editingComponent?.description || ""}
                      onChange={(e) => setEditingComponent(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status Atual</Label>
                    <Select 
                      value={editingComponent?.status || "operational"} 
                      onValueChange={(val) => val && setEditingComponent(prev => ({ ...prev, status: val as Component["status"] }))}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="operational">Operacional</SelectItem>
                        <SelectItem value="degraded">Performance Degradada</SelectItem>
                        <SelectItem value="partial_outage">Instabilidade Parcial</SelectItem>
                        <SelectItem value="major_outage">Instabilidade Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-white text-black hover:bg-zinc-200 w-full" isLoading={loading}>
                      Salvar Componente
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {components.length === 0 ? (
              <div className="p-10 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center text-center">
                <Settings2 className="w-10 h-10 text-zinc-700 mb-4" />
                <p className="text-zinc-400 text-sm">Nenhum componente configurado ainda.</p>
              </div>
            ) : (
              components.map((comp) => (
                <div key={comp.id} className="group p-4 bg-zinc-900/20 border border-zinc-800 rounded-xl flex items-center justify-between hover:bg-zinc-900/40 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-2 h-2 rounded-full", comp.status === 'operational' ? "bg-emerald-500" : "bg-red-500")} />
                    <div>
                      <h5 className="text-sm font-medium text-white">{comp.name}</h5>
                      {comp.description && <p className="text-xs text-zinc-500">{comp.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", getStatusColor(comp.status))}>
                      {getStatusLabel(comp.status)}
                    </Badge>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-zinc-500 hover:text-white"
                        onClick={() => {
                          setEditingComponent(comp);
                          setIsComponentDialogOpen(true);
                        }}
                      >
                        <Settings2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-zinc-500 hover:text-red-400"
                        onClick={() => onDeleteComponent(comp.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Incidentes */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Incidentes Atuais</h4>
            <Dialog open={isIncidentDialogOpen} onOpenChange={setIsIncidentDialogOpen}>
              <DialogTrigger render={
                <Button size="sm" variant="outline" className="border-zinc-800 text-zinc-300">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo
                </Button>
              } />
              <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                  <DialogTitle>Reportar Incidente</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Isso aparecerá imediatamente no histórico da sua página de status.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={onCreateIncident} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Título do Incidente</Label>
                    <Input 
                      placeholder="Ex: Instabilidade no processamento de pagamentos" 
                      className="bg-zinc-900 border-zinc-800"
                      value={newIncident.title}
                      onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição / Update Inicial</Label>
                    <Textarea 
                      placeholder="Estamos investigando um problema..." 
                      className="bg-zinc-900 border-zinc-800 min-h-[100px]"
                      value={newIncident.description}
                      onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Gravidade</Label>
                      <Select 
                        value={newIncident.severity} 
                        onValueChange={(val) => val && setNewIncident(prev => ({ ...prev, severity: val as Incident["severity"] }))}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="minor">Menor</SelectItem>
                          <SelectItem value="major">Maior</SelectItem>
                          <SelectItem value="critical">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select 
                        value={newIncident.status} 
                        onValueChange={(val) => val && setNewIncident(prev => ({ ...prev, status: val as Incident["status"] }))}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="investigating">Investigando</SelectItem>
                          <SelectItem value="identified">Identificado</SelectItem>
                          <SelectItem value="monitoring">Monitorando</SelectItem>
                          <SelectItem value="resolved">Resolvido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-red-600 text-white hover:bg-red-700 w-full" isLoading={loading}>
                      Publicar Incidente
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {incidents.length === 0 ? (
              <div className="p-8 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-2xl text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/20 mx-auto mb-3" />
                <p className="text-zinc-500 text-xs">Nenhum incidente ativo ou recente.</p>
              </div>
            ) : (
              incidents.map((incident) => (
                <div key={incident.id} className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-sm font-semibold text-white leading-tight">{incident.title}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                          {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[9px] bg-zinc-800 text-zinc-400 border-none">
                      {incident.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">{incident.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
