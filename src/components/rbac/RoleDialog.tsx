"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS, ALL_PERMISSION_KEYS, PermissionKey } from "@/lib/auth/permissions";
import { createRoleAction, updateRoleAction } from "@/app/actions/rbac";
import { useState } from "react";
import { Loader2, ShieldCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

interface RoleDialogProps {
  trigger: React.ReactElement;
  orgId: string;
  orgSlug: string;
  role?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    permissions: PermissionKey[];
  };
}

const groupedPermissions = ALL_PERMISSION_KEYS.reduce((acc, key) => {
  const group = key.split(":")[0];
  if (!acc[group]) acc[group] = [];
  acc[group].push(key);
  return acc;
}, {} as Record<string, PermissionKey[]>);

export function RoleDialog({ trigger, orgId, orgSlug, role }: RoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackVariant, setFeedbackVariant] = useState<"error" | "info" | "success">("info");
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>(
    role?.permissions || []
  );

  const isEditing = !!role;
  const isSystemRole = isEditing && ['admin', 'member', 'viewer'].includes(role?.slug || '');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSystemRole) return;
    
    setLoading(true);
    setFeedback(isEditing ? "Atualizando role..." : "Criando role...");
    setFeedbackVariant("info");

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name") as string,
      slug: (formData.get("slug") as string) || (formData.get("name") as string).toLowerCase().replace(/\s+/g, '-'),
      description: formData.get("description") as string,
      permissions: selectedPermissions,
      orgId,
      orgSlug,
    };

    try {
      if (isEditing) {
        await updateRoleAction({ ...data, id: role.id });
      } else {
        await createRoleAction(data);
      }
      setFeedback(isEditing ? "Role atualizada com sucesso." : "Role criada com sucesso.");
      setFeedbackVariant("success");
      setOpen(false);
    } catch (error) {
      console.error("Action failed:", error);
      const message = error instanceof Error ? error.message : "Não foi possível salvar a role.";
      setFeedback(message);
      setFeedbackVariant("error");
    } finally {
      setLoading(false);
    }
  }

  const togglePermission = (key: PermissionKey) => {
    if (isSystemRole) return;
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-[640px] bg-zinc-950 border-zinc-800 p-0 overflow-hidden gap-0 shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="p-6 border-b border-zinc-900 bg-zinc-900/20">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  {isEditing ? "Edit Role" : "Create Custom Role"}
                  {isSystemRole && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] h-5 uppercase tracking-wider font-black">
                      System Base
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-zinc-400 text-sm">
                  {isSystemRole 
                    ? "Base system roles are core to the platform and cannot be modified."
                    : "Define specific capabilities and access rules for this organization."}
                </DialogDescription>
              </div>
              <div className="hidden sm:block">
                <ShieldCheck className={cn("h-10 w-10 transition-colors", isSystemRole ? "text-blue-500/20" : "text-zinc-800")} />
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {feedback ? (
              <FeedbackBanner
                variant={feedbackVariant}
                title={
                  feedbackVariant === "error"
                    ? "Não foi possível salvar"
                    : feedbackVariant === "success"
                      ? "Role salva"
                      : "Processando"
                }
                message={feedback}
              />
            ) : null}
            {/* Core Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Role Display Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={role?.name}
                  placeholder="e.g. Creative Lead"
                  className="bg-zinc-900/50 border-zinc-800 text-zinc-100 h-10 focus:ring-1 focus:ring-zinc-700 transition-all rounded-lg"
                  required
                  disabled={isSystemRole}
                />
              </div>

              {!isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Role Identifier</Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="e.g. creative-lead"
                    className="bg-zinc-900/50 border-zinc-800 text-zinc-100 h-10 font-mono text-[11px] focus:ring-1 focus:ring-zinc-700 transition-all rounded-lg"
                  />
                </div>
              )}

              <div className={cn("space-y-2", !isEditing ? "col-span-2" : "col-span-1 sm:col-span-2")}>
                <Label htmlFor="description" className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Description</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={role?.description || ""}
                  placeholder="Describe the purpose of this role..."
                  className="bg-zinc-900/50 border-zinc-800 text-zinc-100 h-10 focus:ring-1 focus:ring-zinc-700 transition-all rounded-lg"
                  disabled={isSystemRole}
                />
              </div>
            </div>

            {/* Permissions Matrix */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Capability Matrix</Label>
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                  <Info className="h-3 w-3" />
                  Select specific actions this role can perform
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10 border border-zinc-900 rounded-2xl p-6 bg-zinc-950/50 shadow-inner">
                {Object.entries(groupedPermissions).map(([group, keys]) => (
                  <div key={group} className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                      {group}
                    </h4>
                    <div className="space-y-4 pr-2">
                      {keys.map((key) => {
                        const isSelected = selectedPermissions.includes(key);
                        return (
                          <div key={key} className={cn(
                            "flex items-start space-x-3 group transition-all duration-200",
                            isSystemRole && "opacity-60"
                          )}>
                            <div className="relative flex items-center h-5">
                              <Checkbox
                                id={key}
                                checked={isSelected}
                                onCheckedChange={() => togglePermission(key)}
                                disabled={isSystemRole}
                                className={cn(
                                  "border-zinc-800 transition-all duration-300",
                                  "data-[state=checked]:bg-zinc-100 data-[state=checked]:text-zinc-950 data-[state=checked]:border-zinc-100"
                                )}
                              />
                            </div>
                            <div className="grid gap-1 leading-none select-none">
                              <label
                                htmlFor={key}
                                className={cn(
                                  "text-sm font-semibold leading-none cursor-pointer transition-colors",
                                  isSelected ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-300",
                                  isSystemRole && "cursor-not-allowed"
                                )}
                              >
                                {PERMISSIONS[key].name}
                              </label>
                              <p className="text-[10px] text-zinc-600 leading-normal max-w-[200px]">
                                {PERMISSIONS[key].description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-zinc-900 bg-zinc-900/10 flex sm:justify-between items-center bg-zinc-950/80 backdrop-blur-md">
            <div className="hidden sm:block text-[11px] text-zinc-600 font-medium">
              {selectedPermissions.length} permissions explicitly assigned
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg flex-1 sm:flex-none h-11 px-6 font-medium"
              >
                Discard Changes
              </Button>
              <Button
                type="submit"
                disabled={loading || isSystemRole}
                className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 min-w-[140px] rounded-lg flex-1 sm:flex-none h-11 px-6 font-bold transition-all shadow-lg active:scale-95 disabled:hover:bg-zinc-100"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSystemRole ? "System Protected" : (isEditing ? "Update Role" : "Create Role Profile")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
