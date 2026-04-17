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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { inviteMemberAction } from "@/app/actions/member";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

/**
 * Zod schema for invitation form validation
 */
const inviteSchema = z.object({
  email: z.string().email("Endereço de e-mail inválido"),
  roleId: z.string().min(1, "Por favor, selecione um cargo"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteMemberDialogProps {
  roles: { id: string; name: string }[];
  orgId: string;
  orgSlug: string;
}

/**
 * InviteMemberDialog Component
 * 
 * Provides a modal interface to invite new members to the organization.
 * Fetches dynamic roles from the organization's tenant context.
 */
export function InviteMemberDialog({ roles, orgId, orgSlug }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      roleId: roles.find(r => r.name.toLowerCase() === 'member')?.id || roles[0]?.id || "",
    },
  });

  const onSubmit = async (data: InviteFormValues) => {
    setIsPending(true);
    try {
      const result = await inviteMemberAction({
        ...data,
        orgId,
        orgSlug,
      });

      if (result.success) {
        toast.success("Convite enviado com sucesso!");
        setOpen(false);
        reset();
      }
    } catch (error) {
       const message = error instanceof Error ? error.message : "Falha ao enviar convite.";
       toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="font-semibold shadow-sm transition-all hover:shadow-md">
            <UserPlus className="mr-2 h-4 w-4" />
            Convidar Membro
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">Convidar para o Time</DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            O novo membro receberá os detalhes para participar da sua organização.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">E-mail</Label>
            <Input
              id="email"
              placeholder="exemplo@empresa.com"
              {...register("email")}
              className={`bg-muted/50 focus:bg-background transition-colors ${errors.email ? 'border-destructive' : ''}`}
            />
            {errors.email && (
              <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-semibold">Cargo (Role)</Label>
            <Select 
                defaultValue={roles.find(r => r.name.toLowerCase() === 'member')?.id || roles[0]?.id}
                onValueChange={(val) => val && setValue("roleId", val)}
            >
              <SelectTrigger className="bg-muted/50 focus:bg-background transition-colors">
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roleId && (
              <p className="text-xs text-destructive font-medium">{errors.roleId.message}</p>
            )}
          </div>
          <div className="pt-2 flex justify-end gap-3">
             <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpen(false)}
                disabled={isPending}
            >
                Cancelar
            </Button>
            <Button 
                type="submit" 
                disabled={isPending}
                className="min-w-[120px]"
            >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando
                  </>
                ) : (
                  "Enviar Convite"
                )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
