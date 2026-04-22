"use client";

import { useState } from "react";
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
import { Loader2, Plus } from "lucide-react";
import { usePaywall } from "@/components/billing/PaywallProvider";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

const projectSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface CreateProjectDialogProps {
  orgId: string;
  orgSlug: string;
  trigger?: React.ReactElement;
}

export function CreateProjectDialog({ orgId, orgSlug, trigger }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackVariant, setFeedbackVariant] = useState<"error" | "info" | "success">("info");
  const { openPaywall } = usePaywall();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: ProjectFormValues) => {
    setIsPending(true);
    setFeedback("Criando projeto...");
    setFeedbackVariant("info");
    try {
      const result = await createProjectAction({
        ...data,
        orgId,
        orgSlug,
      });

      if (result.success) {
        setFeedback("Projeto criado com sucesso.");
        setFeedbackVariant("success");
        toast.success("Projeto criado com sucesso!");
        setOpen(false);
        reset();
      } else if ('error' in result && result.error === "QUOTA_EXCEEDED") {
        setFeedback("Limite de projetos do plano atual atingido.");
        setFeedbackVariant("error");
        setOpen(false);
        openPaywall({
          title: "Limite de Projetos Atingido",
          reason: "Seu plano atual atingiu o limite de projetos. Faça o upgrade para continuar criando novos espaços de trabalho.",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar projeto.";
      setFeedback(message);
      setFeedbackVariant("error");
      toast.error(message);
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
              New Project
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">Create New Project</DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            This project will be stored in your organization&apos;s isolated schema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          {feedback ? (
            <FeedbackBanner
              variant={feedbackVariant}
              title={
                feedbackVariant === "error"
                  ? "Não foi possível criar"
                  : feedbackVariant === "success"
                    ? "Projeto criado"
                    : "Processando"
              }
              message={feedback}
            />
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">Project Name</Label>
            <Input
              id="name"
              placeholder="E.g. Mobile App Redesign"
              {...register("name")}
              className={`bg-muted/50 focus:bg-background transition-colors ${errors.name ? 'border-destructive' : ''}`}
            />
            {errors.name && (
              <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this project about?"
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
                Cancel
            </Button>
            <Button 
                type="submit" 
                disabled={isPending}
                className="min-w-[140px] font-semibold"
            >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
