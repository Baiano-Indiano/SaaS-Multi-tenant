"use client";

import { useState } from "react";

import { 
  Table, 
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
import { motion, Variants } from "framer-motion";
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
import { useTranslations } from "next-intl";
import { type InferSelectModel } from "drizzle-orm";
import { type invitations } from "@/lib/db/schema";

type Invitation = InferSelectModel<typeof invitations>;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

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
  const t = useTranslations("Members.invitations");
  const tRoles = useTranslations("Members.roles");
  const router = useRouter();
  const [currentTimestamp] = useState(Date.now);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    const promise = cancelInvitationAction(id, orgId, orgSlug);

    toast.promise(promise, {
      loading: t("canceling"),
      success: () => {
        router.refresh();
        return t("cancelSuccess");
      },
      error: t("cancelError"),
    });

    try {
      await promise;
    } finally {
      setCancelingId(null);
    }
  };

  if (invitations.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t border-zinc-800 mt-8">
      <div className="flex items-center gap-2 px-1">
        <Mail className="h-4 w-4 text-zinc-400" />
        <h2 className="text-lg font-semibold tracking-tight text-zinc-100">{t("title")}</h2>
      </div>
      
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl shadow-black/40">
        <Table>
          <TableHeader className="bg-zinc-900/50">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] py-4 px-6 w-[300px]">{t("email")}</TableHead>
              <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] py-4">{t("role")}</TableHead>
              <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] py-4">{t("expiresAt")}</TableHead>
              <TableHead className="text-right text-zinc-400 font-bold uppercase tracking-widest text-[10px] py-4 px-6">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <motion.tbody 
            className="[&_tr:last-child]:border-0"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {invitations.map((invite) => {
               const expiresAt = new Date(invite.expiresAt);
               const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - currentTimestamp) / (1000 * 60 * 60 * 24)));
               
               return (
                <motion.tr 
                  variants={itemVariants}
                  key={invite.id} 
                  className="border-b transition-colors data-[state=selected]:bg-muted border-zinc-800/50 hover:bg-zinc-900/30 group"
                >
                  <TableCell className="py-4 px-6 font-medium text-sm text-zinc-100">
                    {invite.email}
                  </TableCell>
                  <TableCell className="py-4">
                      <Badge variant="outline" className="bg-zinc-900/50 border-zinc-800 text-zinc-300 font-medium px-2 py-0.5 capitalize">
                        {tRoles.has(invite.role ?? "") ? tRoles(invite.role ?? "") : invite.role}
                      </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-xs text-zinc-500 font-medium">
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 opacity-70" />
                        <span>{daysRemaining === 0 ? t("expiresToday") : t("expiresInDays", { days: daysRemaining })}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setCancelingId(invite.id)}
                      className="opacity-0 group-hover:opacity-100 transition-all text-red-400 hover:text-red-300 hover:bg-red-950/30 h-8 font-semibold px-3"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      {t("revoke")}
                    </Button>
                  </TableCell>
                </motion.tr>
               );
            })}
          </motion.tbody>
        </Table>
      </div>
      <AlertDialog open={!!cancelingId} onOpenChange={(open) => !open && setCancelingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cancelConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("back")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (cancelingId) {
                  void handleCancel(cancelingId);
                }
              }}
            >
              {t("confirmCancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
