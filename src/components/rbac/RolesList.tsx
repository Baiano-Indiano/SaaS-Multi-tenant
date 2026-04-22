"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { RoleActions } from "./RoleActions";
import { TenantRoleWithPermissions } from "@/lib/auth/rbac-utils";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

interface RolesListProps {
  roles: TenantRoleWithPermissions[];
  orgId: string;
  orgSlug: string;
}


const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export function RolesList({ roles, orgId, orgSlug }: RolesListProps) {
  if (roles.length === 0) {
    return (
      <FeedbackBanner
        variant="info"
        title="Nenhuma role encontrada"
        message="Crie a primeira role personalizada para começar a definir permissões da organização."
      />
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-sm shadow-xl overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-900/40 border-b border-zinc-800">
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="text-zinc-500 font-medium h-12 uppercase tracking-tighter text-[11px]">Role Name</TableHead>
            <TableHead className="text-zinc-500 font-medium h-12 uppercase tracking-tighter text-[11px]">Permissions</TableHead>
            <TableHead className="text-zinc-500 font-medium h-12 uppercase tracking-tighter text-[11px]">Created At</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {roles.map((role) => {
              const isSystem = ['admin', 'member', 'viewer'].includes(role.slug);
              
              return (
                <motion.tr
                  key={role.id}
                  variants={item}
                  initial="hidden"
                  animate="show"
                  className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors group"
                >
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-100 tracking-tight">{role.name}</span>
                          {isSystem && (
                            <Badge variant="outline" className="text-[9px] h-4 bg-zinc-900/50 border-zinc-800 text-zinc-500 uppercase font-bold tracking-widest px-1.5 leading-none">
                              System
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-zinc-500 font-normal line-clamp-1 group-hover:text-zinc-400 transition-colors">
                          {role.description || "No specific description provided."}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {role.permissions.map((p) => (
                          <Badge 
                            key={p} 
                            variant="outline" 
                            className="bg-zinc-900/30 text-zinc-400 border-zinc-800/80 text-[10px] px-2 py-0 h-5 font-medium hover:border-zinc-700 hover:text-zinc-300 transition-all"
                          >
                            {PERMISSIONS[p]?.name || p}
                          </Badge>
                        ))}
                        {role.permissions.length === 0 && (
                          <span className="text-zinc-700 text-[11px] italic">No permissions assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-zinc-500 text-xs font-mono">
                      {new Date(role.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="py-4">
                      <RoleActions 
                        role={role} 
                        orgId={orgId} 
                        orgSlug={orgSlug} 
                      />
                    </TableCell>
                  </motion.tr>
              );
            })}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
