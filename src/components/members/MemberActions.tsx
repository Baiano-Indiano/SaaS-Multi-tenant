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
import { updateMemberRoleAction, removeMemberAction } from "@/app/actions/member";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { 
  Loader2, 
  UserMinus, 
  Shield, 
  UserCog,
  AlertTriangle
} from "lucide-react";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
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
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const systemRoles = roles.filter(r => ['admin', 'member', 'viewer', 'owner'].includes(r.slug));
  const customRoles = roles.filter(r => !['admin', 'member', 'viewer', 'owner'].includes(r.slug));

  const handleRoleChange = async (newRoleId: string) => {
    if (newRoleId === currentRoleId) return;
    
    setUpdating(true);
    setFeedback("Atualizando nível de acesso...");
    try {
      const result = await updateMemberRoleAction({
        memberId,
        roleId: newRoleId,
        orgId,
        orgSlug
      });
      if (result.success) {
        toast.success("Access level updated");
        setFeedback("Nível de acesso atualizado.");
        router.refresh();
      }
    } catch {
      toast.error("Failed to update access level");
      setFeedback("Não foi possível atualizar o nível de acesso.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="relative group space-y-2">
      <Select 
        disabled={updating}
        defaultValue={currentRoleId} 
        onValueChange={(val) => val && handleRoleChange(val)}
      >
        <SelectTrigger className="w-[180px] bg-zinc-900/50 border-zinc-800 text-zinc-100 h-9 transition-all hover:bg-zinc-900 hover:border-zinc-700 focus:ring-1 focus:ring-zinc-700">
          <div className="flex items-center gap-2 overflow-hidden">
            {updating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
            ) : (
              <UserCog className="h-3.5 w-3.5 text-zinc-500" />
            )}
            <SelectValue placeholder="Select access level" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-300 shadow-2xl">
          {systemRoles.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold py-2">System Standards</SelectLabel>
              {systemRoles.map((role) => (
                <SelectItem 
                  key={role.id} 
                  value={role.id}
                  className="hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer text-sm py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-zinc-600" />
                    {role.name}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          
          {customRoles.length > 0 && (
            <>
              <SelectSeparator className="bg-zinc-900" />
              <SelectGroup>
                <SelectLabel className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold py-2">Organization Custom</SelectLabel>
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
      {feedback ? (
        <FeedbackBanner
          variant={feedback.includes("Não foi possível") ? "error" : "info"}
          message={feedback}
        />
      ) : null}
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
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async () => {
    setIsRemoving(true);
    setError(null);
    try {
      const result = await removeMemberAction(memberId, orgId, orgSlug);
      if (result.success) {
        toast.success("Member successfully removed");
        router.refresh();
      }
    } catch {
      toast.error("Failed to remove member");
      setError("Não foi possível remover este membro agora.");
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
            disabled={isRemoving}
            className="h-9 px-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all group"
          >
            {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4 group-hover:scale-110 transition-transform" />}
            <span className="ml-2 hidden sm:inline">Offboard</span>
          </Button>
        }
      />
      <AlertDialogContent className="bg-zinc-950 border-zinc-800 shadow-2xl overflow-hidden max-w-[400px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <AlertDialogTitle className="text-zinc-100 font-bold">Remove Member?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-zinc-400 text-sm leading-relaxed">
            This will immediately revoke all access to this organization. This action is logged and can only be undone by a new invitation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="bg-zinc-900/10 p-2 sm:p-0 mt-4">
          {error ? (
            <FeedbackBanner
              variant="error"
              title="Remoção não concluída"
              message={error}
              className="w-full mb-2"
            />
          ) : null}
          <AlertDialogCancel className="bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 rounded-lg h-10 px-6 font-medium">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleRemove();
            }}
            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg h-10 px-6 font-bold transition-all"
          >
            Revoke Access
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
