"use client";

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { updateMemberRoleAction, removeMemberAction } from "@/app/actions/member";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RoleSelectorProps {
  memberId: string;
  currentRoleId: string;
  roles: { id: string, name: string }[];
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

  const handleRoleChange = async (newRoleId: string) => {
    try {
      const result = await updateMemberRoleAction({
        memberId,
        roleId: newRoleId,
        orgId,
        orgSlug
      });
      if (result.success) {
        toast.success("Role updated successfully");
        router.refresh();
      }
    } catch {
      toast.error("Failed to update role");
    }
  };

  return (
    <Select defaultValue={currentRoleId} onValueChange={(val) => val && handleRoleChange(val)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.id} value={role.id}>
            {role.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const result = await removeMemberAction(memberId, orgId, orgSlug);
      if (result.success) {
        toast.success("Member removed");
        router.refresh();
      }
    } catch {
      toast.error("Failed to remove member");
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleRemove}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      Remove
    </Button>
  );
}
