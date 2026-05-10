"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, Eye, EyeOff, Plus, AlertCircle } from "lucide-react";
import { createApiKeyAction } from "@/app/actions/api-keys";
import { TenantRole } from "@/lib/auth/rbac-utils";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslations } from "next-intl";

interface CreateApiKeyDialogProps {
  orgId: string;
  orgSlug: string;
  roles: TenantRole[];
  onSuccess: () => void;
}

export function CreateApiKeyDialog({ orgId, orgSlug, roles, onSuccess }: CreateApiKeyDialogProps) {
  const t = useTranslations("Settings.connectivity.apiKeys");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const expiresInDays = "0";
  const [isLoading, setIsLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!name) {
      toast.error(t("createDialog.validation.nameRequired"));
      return;
    }

    setIsLoading(true);
    const promise = createApiKeyAction({
      name,
      roleId,
      orgId,
      orgSlug,
      expiresInDays: parseInt(expiresInDays),
    }).then((result) => {
      if (!result.success) throw new Error(result.error || "Failed to create API key");
      return result;
    });

    toast.promise(promise, {
      loading: t("createDialog.toast.generating"),
      success: (result) => {
        setCreatedKey(result.rawKey || null);
        onSuccess();
        return t("createDialog.toast.success");
      },
      error: (err) => err.message,
    });

    try {
      await promise;
    } catch {
      // Handled by toast
    } finally {
      setIsLoading(false);
    }
  };


  const copyToClipboard = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t("createDialog.toast.copySuccess"));
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset state after a delay to avoid flicker
    setTimeout(() => {
      setCreatedKey(null);
      setName("");
      setShowKey(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isLoading && (val ? setOpen(true) : handleClose())}>
      <DialogTrigger
        render={
          <Button className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 transition-all font-medium h-8 px-3">
            <Plus className="mr-2 h-3.5 w-3.5" />
            {t("create")}
          </Button>
        }
      />
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
        {!createdKey ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("createDialog.success.title")}</DialogTitle>
              <DialogDescription className="text-zinc-400">
                {t("createDialog.success.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-zinc-300">{t("table.name")}</Label>
                <Input
                  id="name"
                  placeholder={t("createDialog.form.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:ring-zinc-700"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-zinc-300">{t("table.role")}</Label>
                <Select value={roleId} onValueChange={(val) => val && setRoleId(val)}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectValue placeholder={t("createDialog.form.rolePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id} className="focus:bg-zinc-800 focus:text-zinc-100">
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-zinc-500">
                  {t("createDialog.form.roleDescription")}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              >
                {t("createDialog.cancel")}
              </Button>
              <Button
                onClick={handleCreate}
                isLoading={isLoading}
                className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
              >
                {t("createDialog.form.generateKey")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("createDialog.success.title")}</DialogTitle>
              <DialogDescription className="text-zinc-400">
                {t("createDialog.success.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Alert className="bg-amber-950/20 border-amber-500/20 text-amber-200/80">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs font-bold uppercase tracking-wider">{t("createDialog.success.warningTitle")}</AlertTitle>
                <AlertDescription className="text-xs leading-relaxed">
                  {t("createDialog.success.warningDescription")}
                </AlertDescription>
              </Alert>
              <div className="relative">
                <Input
                  readOnly
                  type={showKey ? "text" : "password"}
                  value={createdKey}
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 font-mono pr-20"
                />
                <div className="absolute right-1 top-1 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleClose}
                className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 w-full"
              >
                {t("createDialog.success.doneButton")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
