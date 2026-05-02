"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProjectAction } from "@/app/actions/projects";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { usePaywall } from "@/components/billing/PaywallProvider";
import { useTranslations } from "next-intl";

interface CreateProjectDialogProps {
  orgId: string;
  orgSlug: string;
  trigger?: React.ReactElement;
}

export function CreateProjectDialog({ orgId, orgSlug, trigger }: CreateProjectDialogProps) {
  const t = useTranslations("Projects");
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { openPaywall } = usePaywall();

  const projectSchema = useMemo(() => z.object({
    name: z.string().min(3, t("validation.nameMin")),
    description: z.string().optional(),
  }), [t]);

  type ProjectFormValues = z.infer<typeof projectSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
  });

  const onSubmit = async (data: ProjectFormValues) => {
    setIsPending(true);

    const promise = (async () => {
      const result = await createProjectAction({
        ...data,
        orgId,
        orgSlug,
      });

      if (!result.success) {
        if ('error' in result && result.error === "QUOTA_EXCEEDED") {
          throw new Error("QUOTA_EXCEEDED");
        }
        throw new Error('error' in result ? result.error : t("errorDefault"));
      }

      return result;
    })();

    toast.promise(promise, {
      loading: t("creating"),
      success: () => {
        setOpen(false);
        reset();
        return t("createdSuccess");
      },
      error: (error) => {
        if (error instanceof Error && error.message === "QUOTA_EXCEEDED") {
          return t("limitReached");
        }
        return error instanceof Error ? error.message : t("errorDefault");
      },
    });

    try {
      await promise;
    } catch (error) {
      if (error instanceof Error && error.message === "QUOTA_EXCEEDED") {
        setOpen(false);
        openPaywall({
          title: t("limitReachedTitle"),
          reason: t("limitReachedReason"),
        });
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger || (
            <Button className="font-semibold shadow-sm transition-all hover:shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              {t("newProject")}
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">{t("createTitle")}</DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            {t("createDesc")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">{t("nameLabel")}</Label>
            <Input
              id="name"
              placeholder={t("namePlaceholder")}
              {...register("name")}
              className={`bg-muted/50 focus:bg-background transition-colors ${errors.name ? 'border-destructive' : ''}`}
            />
            {errors.name && (
              <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">{t("descLabel")}</Label>
            <Textarea
              id="description"
              placeholder={t("descPlaceholder")}
              {...register("description")}
              className="bg-muted/50 focus:bg-background transition-colors min-h-[100px]"
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
             <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpen(false)}
                disabled={isPending}
            >
                {t("cancel")}
            </Button>
            <Button 
                type="submit" 
                isLoading={isPending}
                className="min-w-[140px] font-semibold"
            >
                {t("createButton")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
