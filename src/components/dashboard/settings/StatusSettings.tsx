"use client";

import { useState } from "react";
import { 
  Activity, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Settings2,
  AlertTriangle,
  Info,
  Sparkles
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  upsertStatusComponentAction, 
  deleteStatusComponentAction, 
  createStatusIncidentAction,
  updateStatusIncidentAction,
  deleteStatusIncidentAction
} from "@/app/actions/status";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

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
  const t = useTranslations("StatusSettings");
  const locale = useLocale();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  // Form states
  const [editingComponent, setEditingComponent] = useState<Partial<Component> | null>(null);
  const [editingIncident, setEditingIncident] = useState<Partial<Incident> | null>(null);

  // AlertDialog states
  const [componentToDelete, setComponentToDelete] = useState<string | null>(null);
  const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);

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
      toast.success(editingComponent.id ? t("toastComponentUpdated") : t("toastComponentCreated"));
      setIsComponentDialogOpen(false);
      setEditingComponent(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("toastSaveError"));
    } finally {
      setLoading(false);
    }
  };

  const onDeleteComponent = async (id: string) => {
    setLoading(true);
    try {
      await deleteStatusComponentAction({ organizationId, id });
      toast.success(t("toastComponentRemoved"));
      setComponentToDelete(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("toastRemoveError"));
    } finally {
      setLoading(false);
    }
  };

  const onSaveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingIncident?.id) {
        await updateStatusIncidentAction({
          organizationId,
          id: editingIncident.id,
          status: editingIncident.status || "investigating",
          description: editingIncident.description || undefined,
        });
        toast.success(t("toastIncidentUpdated"));
      } else {
        await createStatusIncidentAction({
          organizationId,
          ...newIncident,
        });
        toast.success(t("toastIncidentCreated"));
      }
      setIsIncidentDialogOpen(false);
      setEditingIncident(null);
      setNewIncident({ title: "", description: "", status: "investigating", severity: "minor" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("toastSaveError"));
    } finally {
      setLoading(false);
    }
  };

  const onDeleteIncident = async (id: string) => {
    setLoading(true);
    try {
      await deleteStatusIncidentAction({ organizationId, id });
      toast.success(t("toastIncidentRemoved"));
      setIncidentToDelete(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("toastRemoveError"));
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
      case "operational": return t("operational");
      case "degraded": return t("degradedPerformance");
      case "partial_outage": return t("partialOutage");
      case "major_outage": return t("majorOutage");
      default: return status;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "minor": return t("minorImpact");
      case "major": return t("majorImpact");
      case "critical": return t("criticalImpact");
      default: return severity;
    }
  };

  const getIncidentStatusLabel = (status: string) => {
    switch (status) {
      case "investigating": return t("investigating");
      case "identified": return t("identified");
      case "monitoring": return t("monitoring");
      case "resolved": return t("resolved");
      default: return status;
    }
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Premium Header Container */}
      <div className="relative group overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 via-zinc-900/20 to-transparent p-1 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[22px] bg-zinc-950/40 backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/50 to-primary/10 blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <div className="relative w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5 shadow-inner">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-white tracking-tight">{t("title")}</h3>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase tracking-widest font-bold px-2 py-0">{t("live")}</Badge>
              </div>
              <p className="text-zinc-400 text-sm max-w-md leading-relaxed">
                {t("description")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="h-11 px-6 rounded-xl border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-all shadow-lg group/btn"
              onClick={() => window.open(`/status/${orgSlug}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              {t("viewPortal")}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Componentes Grid */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              <h4 className="text-sm font-bold uppercase tracking-[0.15em] text-zinc-500">{t("components")}</h4>
            </div>
            <Dialog open={isComponentDialogOpen} onOpenChange={setIsComponentDialogOpen}>
              <DialogTrigger 
                render={
                  <Button size="sm" className="h-9 px-4 rounded-lg bg-white text-black hover:bg-zinc-200 shadow-xl transition-all active:scale-95" onClick={() => setEditingComponent({})}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    {t("addComponent")}
                  </Button>
                }
              />
              <DialogContent className="bg-zinc-950 border-zinc-800 text-white shadow-2xl sm:max-w-[480px]">
                <DialogHeader className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <DialogTitle className="text-2xl font-bold">{editingComponent?.id ? t("editComponentTitle") : t("newComponentTitle")}</DialogTitle>
                  <DialogDescription className="text-zinc-400 text-base">
                    {t("componentDialogDesc")}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={onUpsertComponent} className="space-y-6 py-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-400 ml-1">{t("identification")}</Label>
                      <Input 
                        placeholder={t("componentNamePlaceholder")} 
                        className="h-12 bg-zinc-900/50 border-zinc-800 focus:ring-primary/20 transition-all rounded-xl"
                        value={editingComponent?.name || ""}
                        onChange={(e) => setEditingComponent(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-400 ml-1">{t("shortDescription")}</Label>
                      <Input 
                        placeholder={t("componentDescPlaceholder")} 
                        className="h-12 bg-zinc-900/50 border-zinc-800 focus:ring-primary/20 transition-all rounded-xl"
                        value={editingComponent?.description || ""}
                        onChange={(e) => setEditingComponent(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-400 ml-1">{t("currentStatus")}</Label>
                      <Select 
                        value={editingComponent?.status || "operational"} 
                        onValueChange={(val: string | null) => val && setEditingComponent(prev => ({ ...prev, status: val as Component["status"] }))}
                      >
                        <SelectTrigger className="h-12 bg-zinc-900/50 border-zinc-800 rounded-xl focus:ring-primary/20 transition-all">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800 text-white p-2">
                          <SelectItem value="operational" className="rounded-lg focus:bg-emerald-500/10 focus:text-emerald-400">{t("operational")}</SelectItem>
                          <SelectItem value="degraded" className="rounded-lg focus:bg-yellow-500/10 focus:text-yellow-400">{t("degradedPerformance")}</SelectItem>
                          <SelectItem value="partial_outage" className="rounded-lg focus:bg-orange-500/10 focus:text-orange-400">{t("partialOutage")}</SelectItem>
                          <SelectItem value="major_outage" className="rounded-lg focus:bg-red-500/10 focus:text-red-400">{t("majorOutage")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="submit" className="h-12 bg-primary text-primary-foreground hover:opacity-90 w-full rounded-xl font-bold shadow-lg" disabled={loading}>
                      {loading ? <Clock className="w-4 h-4 animate-spin mr-2" /> : null}
                      {t("saveComponent")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-4"
          >
            {components.length === 0 ? (
              <div className="p-16 border-2 border-dashed border-zinc-800 rounded-[32px] flex flex-col items-center text-center bg-zinc-900/10 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                  <Settings2 className="w-8 h-8 text-zinc-700" />
                </div>
                <h5 className="text-white font-semibold mb-2">{t("everythingQuiet")}</h5>
                <p className="text-zinc-500 text-sm max-w-xs">{t("addComponentInstruction")}</p>
              </div>
            ) : (
              components.map((comp) => (
                <motion.div 
                   key={comp.id} 
                  variants={itemVariants}
                  className="group relative overflow-hidden p-5 bg-zinc-900/10 border border-zinc-800/60 rounded-2xl flex items-center justify-between hover:border-zinc-700/50 hover:bg-zinc-900/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner transition-colors",
                      comp.status === 'operational' ? "bg-emerald-500/5 border-emerald-500/10" : "bg-red-500/5 border-red-500/10"
                    )}>
                      <Activity className={cn("w-5 h-5", comp.status === 'operational' ? "text-emerald-500" : "text-red-500")} />
                    </div>
                    <div>
                      <h5 className="text-base font-semibold text-white mb-0.5">{comp.name}</h5>
                      {comp.description ? (
                        <p className="text-xs text-zinc-500 leading-normal">{comp.description}</p>
                      ) : (
                        <p className="text-xs text-zinc-600 italic">{t("noDescription")}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant="outline" className={cn("px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest border-none shadow-sm", getStatusColor(comp.status))}>
                        {getStatusLabel(comp.status)}
                      </Badge>
                      <span className="text-[10px] text-zinc-600 font-medium px-1">{t("lastCheckNow")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-zinc-950/40 border border-zinc-800 p-1 rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
                        onClick={() => {
                          setEditingComponent(comp);
                          setIsComponentDialogOpen(true);
                        }}
                      >
                        <Settings2 className="w-4 h-4" />
                      </Button>
                      <div className="w-px h-4 bg-zinc-800" />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                        onClick={() => setComponentToDelete(comp.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>

        {/* Sidebar de Incidentes */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-red-500 rounded-full" />
              <h4 className="text-sm font-bold uppercase tracking-[0.15em] text-zinc-500">{t("incidents")}</h4>
            </div>
            <Dialog open={isIncidentDialogOpen} onOpenChange={setIsIncidentDialogOpen}>
              <DialogTrigger 
                render={
                  <Button size="sm" variant="outline" className="h-9 px-4 rounded-lg border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all" onClick={() => {
                    setEditingIncident(null);
                    setNewIncident({ title: "", description: "", status: "investigating", severity: "minor" });
                  }}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    {t("report")}
                  </Button>
                }
              />
              <DialogContent className="bg-zinc-950 border-zinc-800 text-white shadow-2xl sm:max-w-[520px]">
                <DialogHeader className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <DialogTitle className="text-2xl font-bold">{editingIncident?.id ? t("updateEventTitle") : t("reportIncidentTitle")}</DialogTitle>
                  <DialogDescription className="text-zinc-400 text-base leading-relaxed">
                    {editingIncident?.id 
                      ? t("updateIncidentDesc")
                      : t("reportIncidentDesc")}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSaveIncident} className="space-y-6 py-6">
                  <div className="space-y-4">
                    {!editingIncident?.id && (
                      <div className="space-y-2">
                        <Label className="text-zinc-400 ml-1">{t("whatIsHappening")}</Label>
                        <Input 
                          placeholder={t("incidentTitlePlaceholder")} 
                          className="h-12 bg-zinc-900/50 border-zinc-800 focus:ring-red-500/20 transition-all rounded-xl"
                          value={newIncident.title}
                          onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                          required
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-zinc-400 ml-1">{editingIncident?.id ? t("newUpdateLabel") : t("technicalExplanationLabel")}</Label>
                      <Textarea 
                        placeholder={t("incidentDescPlaceholder")} 
                        className="bg-zinc-900/50 border-zinc-800 min-h-[140px] focus:ring-red-500/20 transition-all rounded-xl resize-none p-4"
                        value={editingIncident?.id ? (editingIncident.description || "") : newIncident.description}
                        onChange={(e) => {
                          if (editingIncident?.id) {
                            setEditingIncident(prev => ({ ...prev, description: e.target.value }));
                          } else {
                            setNewIncident(prev => ({ ...prev, description: e.target.value }));
                          }
                        }}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {!editingIncident?.id && (
                        <div className="space-y-2">
                          <Label className="text-zinc-400 ml-1">{t("impact")}</Label>
                          <Select 
                            value={newIncident.severity} 
                            onValueChange={(val) => val && setNewIncident(prev => ({ ...prev, severity: val as Incident["severity"] }))}
                          >
                            <SelectTrigger className="h-12 bg-zinc-900/50 border-zinc-800 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                              <SelectItem value="minor">{t("minorImpact")}</SelectItem>
                              <SelectItem value="major">{t("majorImpact")}</SelectItem>
                              <SelectItem value="critical">{t("criticalImpact")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className={cn("space-y-2", editingIncident?.id ? "col-span-2" : "")}>
                        <Label className="text-zinc-400 ml-1">{t("currentPhase")}</Label>
                        <Select 
                          value={editingIncident?.id ? editingIncident.status : newIncident.status} 
                           onValueChange={(val: string | null) => {
                            if (editingIncident?.id) {
                              setEditingIncident(prev => ({ ...prev, status: val as Incident["status"] }));
                            } else {
                              setNewIncident(prev => ({ ...prev, status: val as Incident["status"] }));
                            }
                          }}
                        >
                          <SelectTrigger className="h-12 bg-zinc-900/50 border-zinc-800 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                            <SelectItem value="investigating">{t("investigating")}</SelectItem>
                            <SelectItem value="identified">{t("identified")}</SelectItem>
                            <SelectItem value="monitoring">{t("monitoring")}</SelectItem>
                            <SelectItem value="resolved">{t("resolved")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="submit" className="h-12 bg-red-600 text-white hover:bg-red-700 w-full rounded-xl font-bold shadow-lg shadow-red-950/20" disabled={loading}>
                      {loading ? <Clock className="w-4 h-4 animate-spin mr-2" /> : null}
                      {editingIncident?.id ? t("registerUpdate") : t("notifyClients")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="space-y-4"
          >
            {incidents.length === 0 ? (
              <div className="p-12 bg-emerald-500/[0.02] border border-dashed border-emerald-500/10 rounded-[32px] text-center backdrop-blur-sm">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
                <h5 className="text-white font-semibold mb-1">{t("clearSkyTitle")}</h5>
                <p className="text-zinc-500 text-xs px-6">{t("noActiveIncidents")}</p>
              </div>
            ) : (
              incidents.map((incident) => (
                <motion.div 
                  key={incident.id} 
                  variants={itemVariants}
                  className="group relative p-5 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl space-y-4 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/50 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn(
                          "px-1.5 py-0 rounded text-[9px] font-black uppercase tracking-widest border-none shadow-sm",
                          incident.severity === 'critical' ? "bg-red-500 text-white" : 
                          incident.severity === 'major' ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-400"
                        )}>
                          {getSeverityLabel(incident.severity)}
                        </Badge>
                        <h5 className="text-sm font-bold text-white tracking-tight">{incident.title}</h5>
                      </div>
                      <div className="flex items-center gap-2 px-0.5">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">
                          {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true, locale: dateLocale })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-400 border-none text-[9px] uppercase font-bold tracking-wider">
                        {getIncidentStatusLabel(incident.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-zinc-800 rounded-full" />
                    <p className="text-xs text-zinc-500 leading-relaxed pl-4 line-clamp-3 group-hover:line-clamp-none transition-all">
                      {incident.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1 opacity-0 group-hover:opacity-100 transition-all">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg"
                      onClick={() => {
                        setEditingIncident(incident);
                        setIsIncidentDialogOpen(true);
                      }}
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      onClick={() => setIncidentToDelete(incident.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Dialogs */}
      <AlertDialog open={!!componentToDelete} onOpenChange={(open) => !open && setComponentToDelete(null)}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-3xl p-8 max-w-[400px]">
          <AlertDialogHeader className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-center">{t("removeComponent")}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-center text-base leading-relaxed">
              {t("removeComponentDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex flex-col gap-3 sm:flex-col">
            <AlertDialogAction 
              onClick={() => componentToDelete && onDeleteComponent(componentToDelete)}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold order-1 shadow-lg shadow-red-950/20"
              disabled={loading}
            >
              {t("confirmRemoval")}
            </AlertDialogAction>
            <AlertDialogCancel className="w-full h-12 bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl font-bold order-2">
              {t("cancel")}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!incidentToDelete} onOpenChange={(open) => !open && setIncidentToDelete(null)}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-3xl p-8 max-w-[400px]">
          <AlertDialogHeader className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto">
              <Info className="w-7 h-7 text-red-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-center">{t("removeIncident")}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-center text-base leading-relaxed">
              {t("removeIncidentDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex flex-col gap-3 sm:flex-col">
            <AlertDialogAction 
              onClick={() => incidentToDelete && onDeleteIncident(incidentToDelete)}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold order-1 shadow-lg shadow-red-950/20"
              disabled={loading}
            >
              {t("deleteIncident")}
            </AlertDialogAction>
            <AlertDialogCancel className="w-full h-12 bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl font-bold order-2">
              {t("cancel")}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

