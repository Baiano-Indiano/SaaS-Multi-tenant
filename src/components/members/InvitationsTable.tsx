"use client";

import { useState } from "react";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cancelInvitationAction } from "@/app/actions/member";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Mail, Trash2, Clock } from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import { invitations } from "@/lib/db/schema";

type Invitation = InferSelectModel<typeof invitations>;

interface InvitationsTableProps {
  invitations: Invitation[];
  orgId: string;
  orgSlug: string;
}

/**
 * InvitationsTable Component
 * 
 * Lists all pending invitations for the current organization.
 * Shows email, role (slug), days remaining until expiry, and a revoke action.
 */
export function InvitationsTable({ invitations, orgId, orgSlug }: InvitationsTableProps) {
  const router = useRouter();
  const [currentTimestamp] = useState(Date.now);

  const handleCancel = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar este convite?")) return;

    try {
      const result = await cancelInvitationAction(id, orgId, orgSlug);
      if (result.success) {
        toast.success("Convite cancelado.");
        router.refresh();
      }
    } catch {
      toast.error("Falha ao cancelar convite.");
    }
  };

  if (invitations.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t mt-8">
      <div className="flex items-center gap-2 px-1">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold tracking-tight">Convites Pendentes</h2>
      </div>
      
      <div className="rounded-md border bg-card/40 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px]">E-mail</TableHead>
              <TableHead>Cargo (Role)</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invite) => {
               const expiresAt = new Date(invite.expiresAt);
               const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - currentTimestamp) / (1000 * 60 * 60 * 24)));
               
               return (
                <TableRow key={invite.id} className="group transition-colors">
                  <TableCell className="font-medium text-sm">
                    {invite.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-[10px] font-bold px-2 py-0 h-5 bg-background">
                        {invite.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm font-medium">
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 opacity-70" />
                        <span>{daysRemaining === 0 ? "Hoje" : `${daysRemaining} dias`}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleCancel(invite.id)}
                      className="opacity-0 group-hover:opacity-100 transition-all text-destructive hover:text-destructive hover:bg-destructive/10 h-8 font-semibold px-3"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Revogar
                    </Button>
                  </TableCell>
                </TableRow>
               );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
