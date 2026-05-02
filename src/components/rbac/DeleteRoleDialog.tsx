"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteRoleAction } from "@/app/actions/rbac";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DeleteRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId: string;
  roleName: string;
  orgId: string;
  orgSlug: string;
}

export function DeleteRoleDialog({
  open,
  onOpenChange,
  roleId,
  roleName,
  orgId,
  orgSlug,
}: DeleteRoleDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const promise = async () => {
      setLoading(true);
      try {
        await deleteRoleAction(roleId, orgId, orgSlug);
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    };

    toast.promise(promise(), {
      loading: "Excluindo role...",
      success: "Role excluída com sucesso.",
      error: (err) => err instanceof Error ? err.message : "Não foi possível excluir a role.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <div className="flex items-center gap-3 text-red-500 mb-2">
            <div className="p-2 bg-red-500/10 rounded-full">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl">Delete Role</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            Are you sure you want to delete the <span className="text-zinc-100 font-semibold">&quot;{roleName}&quot;</span> role? 
            This action cannot be undone and may affect users currently assigned to this role.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            isLoading={loading}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white min-w-[140px]"
          >
            Delete Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
