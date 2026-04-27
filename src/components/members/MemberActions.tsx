"use client";

import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectLabel,
  SelectSeparator,
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { updateMemberRoleAction, removeMemberAction } from "@/app/actions/member";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  AlertTriangle,
  UserCog,
  Shield,
  UserMinus
} from "lucide-react";
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
import { MemberSessionsDialog } from "./MemberSessionsDialog";

interface RoleSelectorProps {
  memberId: string;
  currentRoleId: string;
  roles: { id: string; name: string; slug: string }[];
  orgId: string;
  orgSlug: string;
}

export function RoleSelector({ 
  memberId, 
  currentRoleId, 
  roles,
  orgId,
  orgSlug
}: RoleSelectorProps) {
  const t = useTranslations("Members");
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const systemRoles = roles.filter(r => ['admin', 'member', 'viewer', 'owner'].includes(r.slug));
  const customRoles = roles.filter(r => !['admin', 'member', 'viewer', 'owner'].includes(r.slug));

  const [value, setValue] = useState(currentRoleId || "");

  // Sync with prop if it changes externally
  useEffect(() => {
    setValue(currentRoleId);
  }, [currentRoleId]);

  const handleRoleChange = async (newRoleId: string) => {
    if (newRoleId === value) return;
    
    setValue(newRoleId);
    setUpdating(true);
    const promise = updateMemberRoleAction({
      memberId,
      roleId: newRoleId,
      orgId,
      orgSlug
    });

    toast.promise(promise, {
      loading: t("updatingRole"),
      success: () => {
        router.refresh();
        return t("roleUpdated");
      },
      error: t("roleUpdateFailed"),
    });

    try {
      await promise;
    } catch {
      setValue(currentRoleId);
      // Erro tratado pelo toast
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="relative group space-y-2">
      <Select 
        disabled={updating}
        value={value} 
        onValueChange={(val) => val && handleRoleChange(val)}
      >
        <SelectTrigger className="w-[180px] bg-zinc-900/50 border-zinc-800 text-zinc-100 h-9 transition-all hover:bg-zinc-900 hover:border-zinc-700 focus:ring-1 focus:ring-zinc-700">
          <div className="flex items-center gap-2 overflow-hidden">
            <UserCog className="h-3.5 w-3.5 text-zinc-500" />
            <SelectValue placeholder={t("selectAccessLevel")} />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-300 shadow-2xl">
          {systemRoles.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold py-2">{t("systemStandards")}</SelectLabel>
              {systemRoles.map((role) => (
                <SelectItem 
                  key={role.id} 
                  value={role.id}
                  className="hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer text-sm py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-zinc-600" />
                    {t(`roles.${role.slug}`)}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          
          {customRoles.length > 0 && (
            <>
              <SelectSeparator className="bg-zinc-900" />
              <SelectGroup>
                <SelectLabel className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold py-2">{t("organizationCustom")}</SelectLabel>
                {customRoles.map((role) => (
                  <SelectItem 
                    key={role.id} 
                    value={role.id}
                    className="hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer text-sm py-2.5"
                  >
                    {role.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export function RemoveMemberButton({ 
  memberId, 
  orgId, 
  orgSlug 
}: { 
  memberId: string, 
  orgId: string, 
  orgSlug: string 
}) {
  const t = useTranslations("Members");
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    const promise = removeMemberAction(memberId, orgId, orgSlug);

    toast.promise(promise, {
      loading: t("removingMember"),
      success: () => {
        router.refresh();
        return t("memberRemoved");
      },
      error: t("removeFailed"),
    });

    try {
      await promise;
    } catch {
      // Erro tratado pelo toast
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button 
            variant="ghost" 
            size="sm" 
            isLoading={isRemoving}
            className="h-9 px-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all group"
          >
            <UserMinus className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="ml-2 hidden sm:inline">{t("offboard")}</span>
          </Button>
        }
      />
      <AlertDialogContent className="bg-zinc-950 border-zinc-800 shadow-2xl overflow-hidden max-w-[400px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <AlertDialogTitle className="text-zinc-100 font-bold">{t("removeConfirmTitle")}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-zinc-400 text-sm leading-relaxed">
            {t("removeConfirmDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="bg-zinc-900/10 p-2 sm:p-0 mt-4">
          <AlertDialogCancel className="bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 rounded-lg h-10 px-6 font-medium">
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleRemove();
            }}
            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg h-10 px-6 font-bold transition-all"
          >
            {t("revokeAccess")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
interface MemberActionsProps {
  member: {
    id: string;
    roleId: string | null;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  roles: { id: string; name: string; slug: string }[];
  orgId: string;
  orgSlug: string;
}

export function MemberActions({ member, roles, orgId, orgSlug }: MemberActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <MemberSessionsDialog member={member} orgId={orgId} />
      <RoleSelector 
        memberId={member.id} 
        currentRoleId={member.roleId || ''} 
        roles={roles} 
        orgId={orgId} 
        orgSlug={orgSlug} 
      />
      <RemoveMemberButton 
        memberId={member.id} 
        orgId={orgId} 
        orgSlug={orgSlug} 
      />
    </div>
  );
}
