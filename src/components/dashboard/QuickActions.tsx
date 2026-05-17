"use client";

import React from "react";
import { Plus, UserPlus, Key, ArrowRight } from "lucide-react";
import { CreateProjectDialog } from "../projects/CreateProjectDialog";
import { InviteMemberDialog } from "../members/InviteMemberDialog";
import { CreateApiKeyDialog } from "../settings/api-keys/create-api-key-dialog";
import { TenantRole } from "@/lib/auth/rbac-utils";

interface QuickActionsProps {
  orgId: string;
  orgSlug: string;
  roles: TenantRole[];
  permissions: {
    canCreateProject: boolean;
    canInviteMember: boolean;
    canManageApiKeys: boolean;
  };
}

export function QuickActions({ orgId, orgSlug, roles, permissions }: QuickActionsProps) {
  const actions = [
    {
      title: "Novo Projeto",
      description: "Inicie um novo ambiente isolado",
      icon: Plus,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      show: permissions.canCreateProject,
      component: (trigger: React.ReactElement) => (
        <CreateProjectDialog orgId={orgId} orgSlug={orgSlug} trigger={trigger} />
      ),
    },
    {
      title: "Convidar Membro",
      description: "Expanda sua equipe no tenant",
      icon: UserPlus,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      show: permissions.canInviteMember,
      component: (trigger: React.ReactElement) => (
        <InviteMemberDialog roles={roles} orgId={orgId} orgSlug={orgSlug} trigger={trigger} />
      ),
    },
    {
      title: "Criar Chave de API",
      description: "Integre com serviços externos",
      icon: Key,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      show: permissions.canManageApiKeys,
      component: (trigger: React.ReactElement) => (
        <CreateApiKeyDialog 
          roles={roles} 
          orgId={orgId} 
          orgSlug={orgSlug} 
          onSuccess={() => {}} // Could trigger a refresh if needed
          trigger={trigger} 
        />
      ),
    },
  ];

  const visibleActions = actions.filter((a) => a.show);

  if (visibleActions.length === 0) return null;

  return (
    <div className="grid gap-4">
      {visibleActions.map((action, i) => {
        const trigger = (
          <button
            className="group relative flex w-full items-center gap-4 p-4 rounded-sm bg-zinc-900/40 border border-zinc-800/50 transition-all duration-300 hover:bg-zinc-800/60 hover:border-zinc-700/50 text-left overflow-hidden"
          >
            {/* Subtle glow effect on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-zinc-800/0 via-white/[0.02] to-zinc-800/0`} />
            
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${action.bg} border ${action.border} ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-200">
                {action.title}
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium truncate mt-0.5">
                {action.description}
              </p>
            </div>

            <ArrowRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" />
          </button>
        );

        return <React.Fragment key={i}>{action.component(trigger)}</React.Fragment>;
      })}
    </div>
  );
}
