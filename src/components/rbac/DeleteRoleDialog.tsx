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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("RBAC");

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
      loading: t("deletingRole"),
      success: t("roleDeleted"),
      error: (err) => err instanceof Error ? err.message : t("deleteRoleError"),
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
            <DialogTitle className="text-xl">{t("deleteRole")}</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            {t.rich("deleteConfirm", {
              roleName,
              highlight: (chunks) => <span className="text-zinc-100 font-semibold">{chunks}</span>
            })}
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
            {t("cancel")}
          </Button>
          <Button
            onClick={handleDelete}
            isLoading={loading}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white min-w-[140px]"
          >
            {t("deleteRole")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
