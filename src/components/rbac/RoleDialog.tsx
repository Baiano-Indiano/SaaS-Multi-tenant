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
import { Loader2 } from "lucide-react";

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

// Group permissions by prefix (e.g., 'org:', 'members:')
const groupedPermissions = ALL_PERMISSION_KEYS.reduce((acc, key) => {
  const group = key.split(":")[0];
  if (!acc[group]) acc[group] = [];
  acc[group].push(key);
  return acc;
}, {} as Record<string, PermissionKey[]>);

export function RoleDialog({ trigger, orgId, orgSlug, role }: RoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>(
    role?.permissions || []
  );

  const isEditing = !!role;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name") as string,
      slug: (formData.get("slug") as string) || (formData.get("name") as string).toLowerCase().replace(/\s+/g, '-'),
      description: formData.get("description") as string,
      permissions: selectedPermissions,
      orgId,
      orgSlug,
    };

    const isSystemRole = isEditing && ['admin', 'member', 'viewer'].includes(role?.slug || '');

    try {
      if (isEditing) {
        if (isSystemRole) {
           // We only allow updating permissions if the user wants, 
           // but Tier 0 said "base permissions NOT editable".
           // Current implementation blocks entire update in backend, 
           // so we stay consistent here.
           throw new Error("System roles are immutable");
        }
        await updateRoleAction({ ...data, id: role.id });
      } else {
        await createRoleAction(data);
      }
      setOpen(false);
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setLoading(false);
    }
  }

  const isSystemRole = isEditing && ['admin', 'member', 'viewer'].includes(role?.slug || '');

  const togglePermission = (key: PermissionKey) => {
    if (isSystemRole) return; // Prevent toggling for system roles
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>{isEditing ? "Edit Role" : "Create New Role"}</DialogTitle>
              {isSystemRole && (
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider h-5 bg-zinc-900 border-zinc-700 text-zinc-400">
                  System
                </Badge>
              )}
            </div>
            <DialogDescription className="text-zinc-400">
              {isSystemRole 
                ? "This is a base system role. Its name and core permissions are managed by the system."
                : isEditing 
                  ? "Update the name, description and permissions for this role." 
                  : "Define a new role and assign its specific permissions."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-zinc-300">Role Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={role?.name}
                placeholder="e.g. Project Manager"
                className="bg-zinc-900 border-zinc-800 text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                required
                disabled={isSystemRole}
              />
            </div>

            {!isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="slug" className="text-zinc-300">Role ID (Slug)</Label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="e.g. project-manager"
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 font-mono text-xs"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-zinc-300">Description</Label>
              <Input
                id="description"
                name="description"
                defaultValue={role?.description || ""}
                placeholder="What can people with this role do?"
                className="bg-zinc-900 border-zinc-800 text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSystemRole}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-zinc-300">Permissions</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-zinc-800 rounded-md p-4 bg-zinc-900/50">
                {Object.entries(groupedPermissions).map(([group, keys]) => (
                  <div key={group} className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800 pb-1">
                      {group}
                    </h4>
                    {keys.map((key) => (
                      <div key={key} className="flex items-start space-x-3 group">
                        <Checkbox
                          id={key}
                          checked={selectedPermissions.includes(key)}
                          onCheckedChange={() => togglePermission(key)}
                          disabled={isSystemRole}
                          className="mt-0.5 border-zinc-700 data-[state=checked]:bg-zinc-100 data-[state=checked]:text-zinc-950 disabled:opacity-50"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={key}
                            className="text-sm font-medium leading-none text-zinc-300 cursor-pointer group-hover:text-zinc-100 transition-colors"
                          >
                            {PERMISSIONS[key].name}
                          </label>
                          <p className="text-[11px] text-zinc-500">
                            {PERMISSIONS[key].description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || isSystemRole}
              className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 min-w-[100px] disabled:opacity-50"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSystemRole ? "System Reserved" : (isEditing ? "Save Changes" : "Create Role")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
