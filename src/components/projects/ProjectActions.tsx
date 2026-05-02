"use client";

import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, ExternalLink, Settings } from "lucide-react";
import { deleteProjectAction } from "@/app/actions/projects";
import { toast } from "sonner";
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

interface ProjectActionsProps {
  projectId: string;
  orgId: string;
  orgSlug: string;
}

export function ProjectActions({ projectId, orgId, orgSlug }: ProjectActionsProps) {
  const t = useTranslations("Projects");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    const promise = deleteProjectAction(projectId, orgId, orgSlug).then(result => {
      if (!result.success) {
        throw new Error(t("deleteError"));
      }
      return result;
    });

    toast.promise(promise, {
      loading: t("deleting"),
      success: () => {
        setShowDeleteDialog(false);
        return t("deletedSuccess");
      },
      error: (err) => err.message,
    });

    try {
      await promise;
    } catch {
      // Erro já tratado no toast.promise
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t("actions")}</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem 
            className="cursor-pointer"
            render={
              <Link href={`/org/${orgSlug}/projects/${projectId}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("open")}
              </Link>
            }
          />
          <DropdownMenuItem 
            className="cursor-pointer"
            render={
              <Link href={`/org/${orgSlug}/projects/${projectId}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                {t("settingsLabel")}
              </Link>
            }
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive cursor-pointer font-medium"
            onSelect={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? t("deleting") : t("deleteProjectTitle")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
