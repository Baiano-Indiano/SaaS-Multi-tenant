"use client";

import { useRef, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Trash2, Calendar, Shield, Key } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteApiKeyAction, getApiKeysAction } from "@/app/actions/api-keys";
import { toast } from "sonner";
import { CreateApiKeyDialog } from "./create-api-key-dialog";
import { TenantRole } from "@/lib/auth/rbac-utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  roleId: string;
  lastUsedAt: Date | null;
  createdAt: Date;
}

interface ApiKeyListProps {
  initialKeys: ApiKey[];
  roles: TenantRole[];
  orgId: string;
  orgSlug: string;
}

export function ApiKeyList({ initialKeys, roles, orgId, orgSlug }: ApiKeyListProps) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys as ApiKey[]);
  const listRef = useRef<HTMLTableSectionElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshKeys = async () => {
    const updatedKeys = await getApiKeysAction(orgId);
    setKeys(updatedKeys as ApiKey[]);
  };

  const handleDelete = async (keyId: string) => {
    toast.promise(
      deleteApiKeyAction({
        keyId,
        orgId,
        orgSlug,
      }),
      {
        loading: "Revoking API key...",
        success: (result) => {
          if (result.success) {
            refreshKeys();
            return "API key revoked successfully";
          }
          throw new Error(result.error || "Failed to revoke API key");
        },
        error: (err) => err.message || "An unexpected error occurred",
      }
    );
  };

  // GSAP Entrance Animation
  useGSAP(() => {
    if (keys.length > 0) {
      gsap.fromTo(
        "tr",
        { 
          opacity: 0, 
          y: 20,
          filter: "blur(10px)"
        },
        { 
          opacity: 1, 
          y: 0, 
          filter: "blur(0px)",
          duration: 0.8, 
          stagger: 0.1, 
          ease: "power4.out" 
        }
      );
    }
  }, { scope: listRef, dependencies: [keys] });

  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || "Unknown Role";
  };

  return (
    <div ref={containerRef} className="space-y-4">
      <div className="flex justify-end">
        <CreateApiKeyDialog 
          orgId={orgId} 
          orgSlug={orgSlug} 
          roles={roles} 
          onSuccess={refreshKeys} 
        />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-900/50">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400 font-medium">Name</TableHead>
              <TableHead className="text-zinc-400 font-medium">Role</TableHead>
              <TableHead className="text-zinc-400 font-medium">Prefix</TableHead>
              <TableHead className="text-zinc-400 font-medium">Last Used</TableHead>
              <TableHead className="text-zinc-400 font-medium">Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody ref={listRef}>
            {keys.length === 0 ? (
              <TableRow className="hover:bg-transparent border-transparent">
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-zinc-500 gap-2">
                    <Key className="h-8 w-8 opacity-20" />
                    <p className="text-sm font-medium">No API keys found</p>
                    <p className="text-xs opacity-60">Create your first key to start integrating.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              keys.map((key) => (
                <TableRow key={key.id} className="border-zinc-800 hover:bg-zinc-900/30 transition-colors group">
                  <TableCell className="font-medium text-zinc-200">
                    {key.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-zinc-700 bg-zinc-800/30 text-zinc-300 font-normal">
                      <Shield className="mr-1 h-3 w-3 opacity-50" />
                      {getRoleName(key.roleId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-500">
                    {key.keyPrefix}...
                  </TableCell>
                  <TableCell className="text-zinc-500 text-xs">
                    {key.lastUsedAt ? (
                      new Date(key.lastUsedAt).toLocaleDateString()
                    ) : (
                      "Never"
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-500 text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 opacity-30" />
                      {new Date(key.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-100">
                        <DropdownMenuItem 
                          onClick={() => handleDelete(key.id)}
                          className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Revoke Key
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <p className="text-[10px] text-zinc-600 text-center uppercase tracking-widest font-bold mt-4">
        Premium Connectivity Engine • Hardened Security
      </p>
    </div>
  );
}
