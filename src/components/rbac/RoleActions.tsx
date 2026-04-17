"use client";

import { useState } from "react";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleDialog } from "./RoleDialog";
import { DeleteRoleDialog } from "./DeleteRoleDialog";
import { PermissionKey } from "@/lib/auth/permissions";

interface RoleActionsProps {
  role: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    permissions: PermissionKey[];
  };
  orgId: string;
  orgSlug: string;
}

export function RoleActions({ role, orgId, orgSlug }: RoleActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger 
          render={
            <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
              <MoreVertical className="h-4 w-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-300">
          <RoleDialog 
            role={role} 
            orgId={orgId} 
            orgSlug={orgSlug}
            trigger={
              <DropdownMenuItem 
                className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Role
              </DropdownMenuItem>
            }
          />
          
          <DropdownMenuItem 
            onClick={() => setDeleteOpen(true)}
            className="text-red-400 hover:bg-red-950/30 focus:bg-red-950/30 cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteRoleDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        roleId={role.id}
        roleName={role.name}
        orgId={orgId}
        orgSlug={orgSlug}
      />
    </>
  );
}
