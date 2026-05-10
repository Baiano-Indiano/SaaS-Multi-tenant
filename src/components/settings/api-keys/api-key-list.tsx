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
import { useConfirm } from "@/components/ui/confirm-dialog";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("Settings.connectivity.apiKeys");
  const { confirm } = useConfirm();
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys as ApiKey[]);
  const listRef = useRef<HTMLTableSectionElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshKeys = async () => {
    const updatedKeys = await getApiKeysAction(orgId);
    setKeys(updatedKeys as ApiKey[]);
  };

  const handleDelete = async (keyId: string) => {
    const isConfirmed = await confirm({
      title: t("actions.revoke.confirmTitle"),
      description: t("actions.revoke.confirmDescription"),
      confirmText: t("actions.revoke.confirmButton"),
      cancelText: t("actions.revoke.cancelButton"),
      variant: "destructive",
    });

    if (!isConfirmed) return;

    toast.promise(
      deleteApiKeyAction({
        keyId,
        orgId,
        orgSlug,
      }),
      {
        loading: t("toast.revoking"),
        success: (result) => {
          if (result.success) {
            refreshKeys();
            return t("toast.success");
          }
          throw new Error(result.error || t("toast.error"));
        },
        error: (err) => err.message || t("toast.genericError"),
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
    return roles.find(r => r.id === roleId)?.name || t("unknownRole");
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

      <div className="rounded-xl border border-border bg-secondary/5 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">{t("table.name")}</TableHead>
              <TableHead className="text-muted-foreground font-medium">{t("table.role")}</TableHead>
              <TableHead className="text-muted-foreground font-medium">{t("table.prefix")}</TableHead>
              <TableHead className="text-muted-foreground font-medium">{t("table.lastUsed")}</TableHead>
              <TableHead className="text-muted-foreground font-medium">{t("table.created")}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody ref={listRef}>
            {keys.length === 0 ? (
              <TableRow className="hover:bg-transparent border-transparent">
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Key className="h-8 w-8 opacity-20" />
                    <p className="text-sm font-medium">{t("noKeys")}</p>
                    <p className="text-xs opacity-60">{t("noKeysDesc")}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              keys.map((key) => (
                <TableRow key={key.id} className="border-border hover:bg-secondary/10 transition-colors group">
                  <TableCell className="font-medium text-foreground">
                    {key.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-primary/10 bg-primary/5 text-primary font-normal">
                      <Shield className="mr-1 h-3 w-3 opacity-50" />
                      {getRoleName(key.roleId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {key.keyPrefix}...
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {key.lastUsedAt ? (
                      new Date(key.lastUsedAt).toLocaleDateString()
                    ) : (
                      t("never")
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 opacity-30" />
                      {new Date(key.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                        <DropdownMenuItem 
                          onClick={() => handleDelete(key.id)}
                          className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("revoke")}
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
      
      <p className="text-[10px] text-muted-foreground/60 text-center uppercase tracking-widest font-bold mt-4">
        {t("footer")}
      </p>
    </div>
  );
}
