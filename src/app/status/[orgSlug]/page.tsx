import { db } from "@/lib/db";
import { statusComponents, statusIncidents, organizations } from "@/lib/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";
import * as motion from "framer-motion/client";

import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): Promise<Metadata> {
  const { orgSlug } = await params;
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) return { title: "Organization Not Found" };

  return {
    title: `Status do Sistema - ${org.name}`,
    description: `Acompanhe o status e a disponibilidade dos serviços da ${org.name}.`,
    openGraph: {
      title: `Status do Sistema - ${org.name}`,
      description: `Acompanhe o status e a disponibilidade dos serviços da ${org.name}.`,
      images: org.logo ? [org.logo] : [],
    },
  };
}

export default async function PublicStatusPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) notFound();

  const components = await db.query.statusComponents.findMany({
    where: eq(statusComponents.organizationId, org.id),
    orderBy: [desc(statusComponents.order), desc(statusComponents.createdAt)],
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const incidents = await db.query.statusIncidents.findMany({
    where: and(
      eq(statusIncidents.organizationId, org.id),
      gte(statusIncidents.createdAt, thirtyDaysAgo)
    ),
    orderBy: [desc(statusIncidents.createdAt)],
  });

  const allOperational = components.every(c => c.status === "operational");
  const hasMajorOutage = components.some(c => c.status === "major_outage");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "degraded": return <Clock className="w-5 h-5 text-yellow-500" />;
      case "partial_outage": return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case "major_outage": return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "operational": return "Operacional";
      case "degraded": return "Performance Degradada";
      case "partial_outage": return "Instabilidade Parcial";
      case "major_outage": return "Instabilidade Crítica";
      default: return "Desconhecido";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-white selection:text-black">
      {/* Premium Gradient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20 relative">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-4">
            {org.logo ? (
              <Image src={org.logo} alt={org.name} width={40} height={40} className="rounded-lg object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white">
                {org.name.charAt(0)}
              </div>
            )}
            <h1 className="text-xl font-bold text-white tracking-tight">{org.name}</h1>
          </div>
          <Badge variant="outline" className="border-zinc-800 bg-zinc-900/50 text-zinc-400 font-medium px-3 py-1">
            Status do Sistema
          </Badge>
        </header>

        {/* Hero Status */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn(
          "mb-12 p-8 rounded-3xl border transition-all duration-700",
          allOperational 
            ? "bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_50px_-12px_rgba(16,185,129,0.1)]" 
            : hasMajorOutage 
              ? "bg-red-500/5 border-red-500/20 shadow-[0_0_50px_-12px_rgba(239,68,68,0.1)]"
              : "bg-yellow-500/5 border-yellow-500/20 shadow-[0_0_50px_-12px_rgba(234,179,8,0.1)]"
        )}>
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse",
              allOperational ? "bg-emerald-500 text-black" : hasMajorOutage ? "bg-red-500 text-white" : "bg-yellow-500 text-black"
            )}>
              {allOperational ? <ShieldCheck className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {allOperational 
                  ? "Todos os sistemas operacionais" 
                  : hasMajorOutage 
                    ? "Instabilidade Crítica Detectada" 
                    : "Instabilidade Parcial em Alguns Sistemas"}
              </h2>
              <p className="text-zinc-400 mt-1">
                {allOperational 
                  ? "Nenhum problema reportado nos últimos 30 dias." 
                  : "Nossa equipe técnica já está ciente e trabalhando na resolução."}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Components Grid */}
        <section className="mb-16 space-y-6">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Componentes</h3>
            <span className="text-xs text-zinc-600">Atualizado em tempo real</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {components.length === 0 ? (
              <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-3xl">
                <p className="text-zinc-500 italic">Nenhum componente monitorado no momento.</p>
              </div>
            ) : (
              components.map((comp, idx) => (
                <motion.div 
                  key={comp.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + (idx * 0.05) }}
                  className="group p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">{comp.name}</span>
                    {comp.description && <span className="text-xs text-zinc-500 mt-0.5">{comp.description}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border",
                      comp.status === "operational" ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/10" : "text-red-500 border-red-500/20 bg-red-500/10"
                    )}>
                      {getStatusText(comp.status)}
                    </span>
                    {getStatusIcon(comp.status)}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Incidents Timeline */}
        <section className="space-y-10">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-2 mb-8">Histórico de Incidentes</h3>
          {incidents.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/20 border border-zinc-800 rounded-3xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/20 mx-auto mb-4" />
              <p className="text-zinc-500">Nenhum incidente registrado nos últimos 30 dias.</p>
            </div>
          ) : (
            <div className="relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-[2px] before:bg-zinc-800">
              {incidents.map((incident, idx) => (
                <motion.div 
                  key={incident.id} 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative"
                >
                  <div className={cn(
                    "absolute left-[-28px] top-1.5 w-[14px] h-[14px] rounded-full border-2 border-zinc-950",
                    incident.status === "resolved" ? "bg-emerald-500" : "bg-red-500 animate-pulse"
                  )} />
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">
                        {format(new Date(incident.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </span>
                      <Badge className={cn(
                        "text-[9px] uppercase font-black px-2 py-0.5 h-auto",
                        incident.status === "resolved" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                      )}>
                        {incident.status}
                      </Badge>
                    </div>
                    <h4 className="text-lg font-bold text-white tracking-tight">{incident.title}</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
                      {incident.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-32 pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} {org.name}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Powered by</span>
            <span className="text-xs font-bold text-white tracking-tighter">ANTIGRAVITY</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
