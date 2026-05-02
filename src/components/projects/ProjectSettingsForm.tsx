"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { updateProjectAction, deleteProjectAction } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Save, Loader2, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProjectSettingsFormProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    orgId: string;
  };
  orgSlug: string;
}

export function ProjectSettingsForm({ project, orgSlug }: ProjectSettingsFormProps) {
  const t = useTranslations("Projects");
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const projectSchema = useMemo(() => z.object({
    name: z.string().min(3, t("validation.nameMin")),
    description: z.string().optional(),
    status: z.enum(["active", "archived"]),
  }), [t]);

  type ProjectFormValues = z.infer<typeof projectSchema>;

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project.name,
      description: project.description || "",
      status: (project.status as "active" | "archived") || "active",
    },
  });

  async function onUpdate(values: ProjectFormValues) {
    setIsUpdating(true);
    try {
      const result = await updateProjectAction(project.orgId, project.id, orgSlug, values);
      if (result.success) {
        toast.success(t("settings.savedSuccess"));
        router.refresh();
      } else {
        toast.error(result.error || t("settings.error"));
      }
    } catch {
      toast.error(t("unexpectedError"));
    } finally {
      setIsUpdating(false);
    }
  }

  async function onDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteProjectAction(project.id, project.orgId, orgSlug);
      if (result.success) {
        toast.success(t("deletedSuccess"));
        router.push(`/org/${orgSlug}/projects`);
      } else {
        toast.error(result.error || t("deleteError"));
      }
    } catch {
      toast.error(t("unexpectedError"));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-100 font-semibold tracking-tight">{t("settings.generalTab")}</CardTitle>
            <CardDescription className="text-zinc-400">
              {t("settings.generalDesc")}
            </CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onUpdate)}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-200">{t("nameLabel")}</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-indigo-500/50 focus:ring-indigo-500/20 text-zinc-100"
                  placeholder={t("namePlaceholder")}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500 font-medium">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-zinc-200">{t("descLabel")}</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-indigo-500/50 focus:ring-indigo-500/20 text-zinc-100 min-h-[100px] resize-none"
                  placeholder={t("descPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-zinc-200">{t("statusLabel")}</Label>
                <Select
                  defaultValue={form.getValues("status")}
                  onValueChange={(value) => form.setValue("status", value as "active" | "archived", { shouldDirty: true })}
                >
                  <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-zinc-100">
                    <SelectValue placeholder={t("selectStatus")} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectItem value="active">{t("status.active")}</SelectItem>
                    <SelectItem value="archived">{t("status.archived")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="border-t border-zinc-800/50 pt-6">
              <Button 
                type="submit" 
                disabled={isUpdating || !form.formState.isDirty}
                className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 transition-all"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isUpdating ? t("settings.saving") : t("settings.saveChanges")}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="border-red-900/30 bg-red-950/10 backdrop-blur-sm overflow-hidden relative">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Trash2 className="h-24 w-24 text-red-500" />
          </div>
          <CardHeader>
            <CardTitle className="text-xl text-red-400 flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-5 w-5" />
              {t("dangerZone")}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t("dangerZoneDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-red-950/20 border border-red-900/20">
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-100">{t("deleteProjectTitle")}</p>
                <p className="text-xs text-zinc-400">
                  {t("deleteProjectDesc")}
                </p>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button 
                      variant="destructive" 
                      className="gap-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-900/50 transition-all shadow-lg shadow-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("deleteProjectTitle")}
                    </Button>
                  }
                />
                <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold">{t("deleteAbsoluteConfirm")}</AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400">
                      {t("deleteAbsoluteDesc", { name: project.name })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700">
                      {t("cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={onDelete}
                      isLoading={isDeleting}
                      className="bg-red-600 hover:bg-red-500 text-white border-none font-semibold"
                    >
                      {t("yesDelete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
