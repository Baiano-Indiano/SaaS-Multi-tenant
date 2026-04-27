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
import { UserPlus } from "lucide-react";
import { usePaywall } from "@/components/billing/PaywallProvider";
import { useTranslations } from "next-intl";

type InviteFormValues = {
  email: string;
  roleId: string;
};

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
  const t = useTranslations("Members");
  const tCommon = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { openPaywall } = usePaywall();

  const inviteSchema = z.object({
    email: z.string().email(t("validation.emailInvalid")),
    roleId: z.string().min(1, t("validation.roleRequired")),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      roleId: roles.find(r => r.name.toLowerCase() === 'member')?.id || roles[0]?.id || "",
    },
  });

  const selectedRoleId = watch("roleId");

  const onSubmit = async (data: InviteFormValues) => {
    setIsPending(true);

    const promise = (async () => {
      const result = await inviteMemberAction({
        ...data,
        orgId,
        orgSlug,
      });

      if (!result.success) {
        if (result.error === "QUOTA_EXCEEDED") {
          throw new Error("QUOTA_EXCEEDED");
        }
        throw new Error(result.error || t("failedInvite"));
      }

      return result;
    })();

    toast.promise(promise, {
      loading: t("inviting"),
      success: () => {
        setOpen(false);
        reset();
        return t("invitedSuccess");
      },
      error: (error) => {
        if (error instanceof Error && error.message === "QUOTA_EXCEEDED") {
          return t("limitReached");
        }
        return error instanceof Error ? error.message : t("failedInvite");
      },
    });

    try {
      await promise;
    } catch (error) {
      if (error instanceof Error && (error.message === "QUOTA_EXCEEDED" || error.message.includes("plan only allows up to"))) {
        setOpen(false);
        openPaywall({
          title: t("limitReachedTitle"),
          reason: error.message === "QUOTA_EXCEEDED" 
            ? t("limitReachedReason") 
            : error.message,
        });
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="font-semibold shadow-sm transition-all hover:shadow-md">
          <UserPlus className="mr-2 h-4 w-4" />
          {t("inviteMember")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">{t("inviteMember")}</DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            {t("inviteDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">{t("emailLabel")}</Label>
            <Input
              id="email"
              placeholder={t("emailPlaceholder")}
              {...register("email")}
              className={`bg-muted/50 focus:bg-background transition-colors ${errors.email ? 'border-destructive' : ''}`}
            />
            {errors.email && (
              <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-semibold">{t("roleLabel")}</Label>
            <Select 
                value={selectedRoleId}
                onValueChange={(val) => val && setValue("roleId", val)}
            >
              <SelectTrigger className="bg-muted/50 focus:bg-background transition-colors">
                <SelectValue placeholder={t("selectRole")} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {t.has(`roles.${(role as { slug?: string }).slug}`) ? t(`roles.${(role as { slug?: string }).slug}`) : role.name}
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
                {tCommon("cancel")}
            </Button>
            <Button 
                type="submit" 
                isLoading={isPending}
                className="min-w-[120px]"
            >
                {t("sendInvitation")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
