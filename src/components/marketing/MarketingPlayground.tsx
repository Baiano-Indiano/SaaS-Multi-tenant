"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Globe, Terminal, Activity, CheckCircle2 } from "lucide-react";
import { SlackIcon } from "@/components/icons";

type EventType = "project.created" | "member.invited" | "security.anomaly" | "billing.subscribed";

interface EventConfig {
  label: string;
  desc: string;
  slackMsg: string;
  slackColor: string;
  payload: Record<string, unknown>;
}

export function MarketingPlayground() {
  const [activeEvent, setActiveEvent] = useState<EventType>("project.created");
  const [isTriggered, setIsTriggered] = useState(false);


  const configs: Record<EventType, EventConfig> = {
    "project.created": {
      label: "project.created",
      desc: "Disparado quando um novo projeto é criado",
      slackMsg: "🚀 *Novo Projeto Criado*: O projeto `gravity-prod` foi provisionado com sucesso pelo usuário `Jane Doe`.",
      slackColor: "#10b981",
      payload: {
        event: "project.created",
        timestamp: "2026-05-31T09:05:00Z",
        orgId: "org_acme_123",
        data: {
          projectId: "proj_99",
          name: "gravity-prod",
          dbSize: "0MB",
          creator: {
            name: "Jane Doe",
            email: "jane@acme.com"
          }
        }
      }
    },
    "member.invited": {
      label: "member.invited",
      desc: "Disparado ao enviar um convite de membro",
      slackMsg: "👥 *Membro Convidado*: `John Smith` foi convidado para a organização por `Jane Doe` com a função de `admin`.",
      slackColor: "#3b82f6",
      payload: {
        event: "member.invited",
        timestamp: "2026-05-31T09:05:00Z",
        orgId: "org_acme_123",
        data: {
          inviteId: "inv_456",
          email: "john.smith@acme.com",
          role: "admin",
          inviter: "Jane Doe"
        }
      }
    },
    "security.anomaly": {
      label: "security.anomaly",
      desc: "Disparado ao detectar atividade de login suspeita",
      slackMsg: "🚨 *Alerta de Segurança*: Novo login detectado de um ambiente não reconhecido (IP: `95.161.226.11` - São Petersburgo, RU) para o usuário `Jane Doe`.",
      slackColor: "#ef4444",
      payload: {
        event: "security.anomaly",
        timestamp: "2026-05-31T09:05:00Z",
        orgId: "org_acme_123",
        data: {
          userId: "usr_111",
          email: "jane@acme.com",
          ip: "95.161.226.11",
          location: "St. Petersburg, Russia",
          actionRequired: "MFA Check / Password Reset"
        }
      }
    },
    "billing.subscribed": {
      label: "billing.subscribed",
      desc: "Disparado quando a assinatura do Stripe é ativada",
      slackMsg: "💳 *Assinatura Ativada*: Organização fez o upgrade com sucesso para o plano `Pro` (Stripe ID: `sub_stripe_111`).",
      slackColor: "#f59e0b",
      payload: {
        event: "billing.subscribed",
        timestamp: "2026-05-31T09:05:00Z",
        orgId: "org_acme_123",
        data: {
          subscriptionId: "sub_stripe_111",
          plan: "pro",
          amount: "R$ 49,90/mês",
          currency: "BRL"
        }
      }
    }
  };

  const handleTrigger = () => {
    if (isTriggered) return;
    setIsTriggered(true);
    
    // Reset trigger after animation completes (2.5 seconds)
    setTimeout(() => {
      setIsTriggered(false);
    }, 2500);
  };

  const currentConfig = configs[activeEvent];

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-24 border-t border-zinc-900 bg-zinc-950/20 relative">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="text-center max-w-2xl mx-auto mb-16 relative z-10">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">
          Playground Interativo
        </span>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mt-4">
          Veja a Automação em Ação
        </h2>
        <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
          Simule o disparo de eventos de infraestrutura e assista em tempo real ao processamento do gateway distribuindo webhooks e alertas para aplicativos externos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">
        {/* Left Control Panel (col-span-4) */}
        <div className="lg:col-span-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-3">
                1. Selecione um Evento
              </h3>
              <div className="flex flex-col gap-2">
                {(Object.keys(configs) as EventType[]).map((key) => {
                  const isActive = activeEvent === key;
                  return (
                    <button
                      key={key}
                      onClick={() => !isTriggered && setActiveEvent(key)}
                      disabled={isTriggered}
                      className={`text-left px-4 py-3 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                        isActive
                          ? "bg-zinc-900 border-zinc-800 text-emerald-400 shadow-lg shadow-black/20"
                          : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/10"
                      }`}
                    >
                      <div className="font-mono">{configs[key].label}</div>
                      <div className="text-[9px] text-zinc-500 font-medium mt-1 group-hover:text-zinc-400">
                        {configs[key].desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-900 mt-6">
            <button
              onClick={handleTrigger}
              disabled={isTriggered}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold uppercase tracking-wider text-xs border transition-all cursor-pointer ${
                isTriggered
                  ? "bg-zinc-900 border-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-400 border-emerald-400 text-zinc-950 hover:shadow-lg hover:shadow-emerald-500/10"
              }`}
            >
              {isTriggered ? (
                <>
                  <Activity className="h-4 w-4 animate-spin text-zinc-500" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-zinc-950 text-zinc-950" />
                  <span>Disparar Evento</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Middle Animation Canvas (col-span-4) */}
        <div className="lg:col-span-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
          {/* Graphic grid layout */}
          <div className="flex flex-col items-center gap-12 w-full relative z-10">
            {/* Source */}
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shadow-lg">
                <Terminal className="h-5 w-5" />
              </div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-2">API Client</span>
            </div>

            {/* Connection SVG Line Canvas */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 200 300" fill="none">
                {/* Line Path 1 (Client to Webhook) */}
                <path d="M 100 65 L 40 230" stroke="#27272a" strokeWidth="2" strokeDasharray="4 4" />
                {/* Line Path 2 (Client to Slack) */}
                <path d="M 100 65 L 160 230" stroke="#27272a" strokeWidth="2" strokeDasharray="4 4" />

                {/* Animated Particles flowing on trigger */}
                {isTriggered && (
                  <>
                    <motion.circle
                      r="4"
                      fill="#10b981"
                      initial={{ offsetDistance: "0%" }}
                      animate={{ offsetDistance: "100%" }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                      style={{
                        offsetPath: "path('M 100 65 L 40 230')",
                        offsetRotate: "auto",
                      }}
                    />
                    <motion.circle
                      r="4"
                      fill="#10b981"
                      initial={{ offsetDistance: "0%" }}
                      animate={{ offsetDistance: "100%" }}
                      transition={{ duration: 1.2, ease: "easeInOut", delay: 0.1 }}
                      style={{
                        offsetPath: "path('M 100 65 L 160 230')",
                        offsetRotate: "auto",
                      }}
                    />
                  </>
                )}
              </svg>
            </div>

            {/* Target Destinations */}
            <div className="flex justify-between w-full pt-16 px-4">
              <div className="flex flex-col items-center">
                <div className={`h-12 w-12 rounded-xl bg-zinc-900 border flex items-center justify-center transition-colors duration-300 ${
                  isTriggered ? "border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10" : "border-zinc-800 text-zinc-500"
                }`}>
                  <Globe className="h-5 w-5" />
                </div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-2">Webhook URL</span>
              </div>

              <div className="flex flex-col items-center">
                <div className={`h-12 w-12 rounded-xl bg-zinc-900 border flex items-center justify-center transition-colors duration-300 ${
                  isTriggered ? "border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10" : "border-zinc-800 text-zinc-500"
                }`}>
                  <SlackIcon className="h-5 w-5" />
                </div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-2">Slack Hub</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Dashboard Panel (col-span-4) */}
        <div className="lg:col-span-8 flex flex-col md:grid md:grid-cols-2 gap-4">
          {/* Top/Left: Webhook JSON Output */}
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl overflow-hidden flex flex-col h-[320px]">
            <div className="bg-zinc-950/80 px-4 py-2.5 border-b border-zinc-900 flex items-center justify-between">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-zinc-500" /> Webhook Payload
              </span>
              <span className="text-[9px] text-zinc-600 font-mono">POST 200 OK</span>
            </div>
            <div className="p-4 flex-1 overflow-auto font-mono text-[10px] text-zinc-400 bg-zinc-950/20">
              <pre>{JSON.stringify(currentConfig.payload, null, 2)}</pre>
            </div>
          </div>

          {/* Bottom/Right: Slack UI Message Simulation */}
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl overflow-hidden flex flex-col h-[320px]">
            <div className="bg-zinc-950/80 px-4 py-2.5 border-b border-zinc-900 flex items-center gap-2">
              <SlackIcon className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-[9px] font-bold text-zinc-200 uppercase tracking-wider">Slack Channel Mock</span>
            </div>
            <div className="p-5 flex-1 bg-[#1A1D21] flex flex-col justify-end text-zinc-300">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-white">G</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-white">Gravity Bot</span>
                      <span className="text-[9px] text-zinc-500">APLICATIVO 9:05 AM</span>
                    </div>
                    <div className="border-l-4 pl-3 py-1 space-y-1.5" style={{ borderColor: currentConfig.slackColor }}>
                      <p className="text-[11px] leading-relaxed text-zinc-200">
                        {currentConfig.slackMsg.split("*").map((chunk, i) => 
                          i % 2 === 1 ? <strong key={i} className="text-white">{chunk}</strong> : chunk
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isTriggered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 1.2 }}
                      className="flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 p-2 rounded-lg"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mensagem entregue com sucesso no Slack.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
