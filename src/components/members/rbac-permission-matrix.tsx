"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Shield, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RbacPermissionMatrixProps {
  roles: Array<{ id: string; name: string; slug: string }>;
}

export function RbacPermissionMatrix({ roles }: RbacPermissionMatrixProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);
  const [hoveredPermission, setHoveredPermission] = useState<string | null>(null);

  // Default permissions mapping
  const permissionKeys = [
    { key: "org:update", name: "Configurar Organização", desc: "Alterar nome, slug e carência de MFA" },
    { key: "members:invite", name: "Convidar Membros", desc: "Enviar novos convites de adesão" },
    { key: "members:remove", name: "Remover Membros", desc: "Revogar permissões e banir membros" },
    { key: "projects:create", name: "Criar Projetos", desc: "Provisionar novos bancos e projetos" },
    { key: "projects:delete", name: "Excluir Projetos", desc: "Deletar projetos permanentemente" },
    { key: "billing:manage", name: "Gerenciar Assinatura", desc: "Configurar Stripe e faturamento" },
    { key: "audit_logs:read", name: "Visualizar Logs", desc: "Auditar atividades e logs de segurança" },
  ];

  // Map roles to their capability checks
  const checkPermission = (roleSlug: string, permissionKey: string): boolean => {
    const slug = roleSlug.toLowerCase();
    
    // Owner has absolute control over everything
    if (slug === "owner") return true;
    
    // Admin has control over everything except deleting the org or some owner actions
    if (slug === "admin") {
      return permissionKey !== "org:delete"; // and billing is fine
    }
    
    // Member has basic developer access
    if (slug === "member") {
      return ["projects:create", "audit_logs:read"].includes(permissionKey);
    }
    
    // Viewer has read-only access
    if (slug === "viewer") {
      return ["audit_logs:read"].includes(permissionKey);
    }

    return false;
  };

  // Standard static roles mapping fallback if DB roles are empty
  const displayRoles = roles.length > 0 
    ? roles 
    : [
        { id: "1", name: "Proprietário", slug: "owner" },
        { id: "2", name: "Administrador", slug: "admin" },
        { id: "3", name: "Membro", slug: "member" },
        { id: "4", name: "Visualizador", slug: "viewer" }
      ];

  return (
    <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl overflow-hidden relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-900/20 transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-zinc-900/50 border border-zinc-800 text-emerald-500 group-hover:text-emerald-400 transition-colors">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 group-hover:text-white transition-colors">
              Matriz de Permissões da Organização (RBAC)
            </h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Clique para {isOpen ? "ocultar" : "visualizar"} o mapeamento de governança e acessos
            </p>
          </div>
        </div>
        <div className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 font-mono border border-zinc-800 bg-zinc-950 px-2.5 py-1 rounded transition-colors">
          {isOpen ? "OCULTAR" : "MOSTRAR"}
        </div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0 }}
        className="overflow-hidden"
      >
        <div className="p-5 md:p-6 pt-2 border-t border-zinc-900">
          <p className="text-[11px] text-zinc-500 mb-6 leading-relaxed max-w-2xl">
            Veja as ações permitidas para cada nível de acesso. Passe o mouse sobre as funções ou permissões para destacar o mapeamento de governança de segurança.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900">
                  <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-wider text-zinc-500 min-w-[200px]">
                    Permissão / Recurso
                  </th>
                  {displayRoles.map((role) => (
                    <th
                      key={role.slug}
                      onMouseEnter={() => setHoveredRole(role.slug)}
                      onMouseLeave={() => setHoveredRole(null)}
                      className={`py-3 px-4 text-center text-[10px] font-black uppercase tracking-wider transition-colors duration-200 min-w-[100px] ${
                        hoveredRole === role.slug ? "text-emerald-400" : "text-zinc-500"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="capitalize">{role.name}</span>
                        <Badge variant="outline" className="text-[8px] px-1 py-0 border-zinc-800 text-zinc-600 font-mono">
                          {role.slug}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50">
                {permissionKeys.map((p) => {
                  const isRowHovered = hoveredPermission === p.key;
                  return (
                    <tr
                      key={p.key}
                      onMouseEnter={() => setHoveredPermission(p.key)}
                      onMouseLeave={() => setHoveredPermission(null)}
                      className={`transition-colors duration-150 ${
                        isRowHovered ? "bg-zinc-900/10" : ""
                      }`}
                    >
                      <td className="py-3.5 pr-4 relative">
                        {isRowHovered && (
                          <motion.div
                            layoutId="rowGlow"
                            className="absolute inset-0 bg-emerald-500/[0.02] border-l-2 border-emerald-500/50 pointer-events-none"
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                        <div className="relative z-10 flex items-start gap-2">
                          <div className="mt-0.5">
                            <Info className="h-3 w-3 text-zinc-600 shrink-0" />
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold text-zinc-200">{p.name}</div>
                            <div className="text-[9px] text-zinc-500 mt-0.5 leading-snug">{p.desc}</div>
                          </div>
                        </div>
                      </td>
                      {displayRoles.map((role) => {
                        const hasAccess = checkPermission(role.slug, p.key);
                        const isColHovered = hoveredRole === role.slug;
                        return (
                          <td
                            key={role.slug}
                            onMouseEnter={() => setHoveredRole(role.slug)}
                            onMouseLeave={() => setHoveredRole(null)}
                            className={`py-3.5 px-4 text-center transition-colors duration-150 relative ${
                              isColHovered ? "bg-zinc-900/20" : ""
                            }`}
                          >
                            {isColHovered && (
                              <div className="absolute inset-0 border-x border-zinc-800/40 pointer-events-none bg-emerald-500/[0.01]" />
                            )}
                            <div className="relative z-10 flex justify-center">
                              {hasAccess ? (
                                <motion.div
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  className="h-5 w-5 rounded-full bg-emerald-950/40 border border-emerald-900/60 flex items-center justify-center text-emerald-400"
                                >
                                  <Check className="h-3 w-3" />
                                </motion.div>
                              ) : (
                                <div className="h-5 w-5 rounded-full bg-zinc-950/20 border border-zinc-900 flex items-center justify-center text-zinc-600">
                                  <X className="h-2.5 w-2.5" />
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
