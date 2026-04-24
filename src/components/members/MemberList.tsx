"use client";

import { 
  Table, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MemberActions } from "./MemberActions";
import { Shield, Mail } from "lucide-react";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

interface Member {
  id: string;
  role: string;
  roleId: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  createdAt: Date;
}

interface MemberListProps {
  members: Member[];
  orgId: string;
  orgSlug: string;
  roles: { id: string; name: string; slug: string }[];
}

export function MemberList({ members, orgId, orgSlug, roles }: MemberListProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl shadow-black/40">
      <Table>
        <TableHeader className="bg-zinc-900/50">
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] py-4 px-6">Member</TableHead>
            <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] py-4">Role</TableHead>
            <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] py-4">Joined</TableHead>
            <TableHead className="text-right text-zinc-400 font-bold uppercase tracking-widest text-[10px] py-4 px-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <motion.tbody 
          className="[&_tr:last-child]:border-0"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {members.map((member) => (
            <motion.tr 
              variants={itemVariants}
              key={member.id} 
              className="border-b transition-colors data-[state=selected]:bg-muted border-zinc-800/50 hover:bg-zinc-900/30 group"
            >
              <TableCell className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                    <AvatarImage src={member.user.image || ""} />
                    <AvatarFallback className="bg-zinc-900 text-zinc-400 text-xs">
                      {member.user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
                      {member.user.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Mail className="h-3 w-3" />
                      {member.user.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <Badge variant="outline" className="bg-zinc-900/50 border-zinc-800 text-zinc-300 font-medium px-2 py-0.5 capitalize">
                  <Shield className="h-3 w-3 mr-1.5 text-zinc-500" />
                  {member.role}
                </Badge>
              </TableCell>
              <TableCell className="py-4 text-xs text-zinc-500 font-medium">
                {new Date(member.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right py-4 px-6">
                <MemberActions 
                  member={member} 
                  roles={roles} 
                  orgId={orgId} 
                  orgSlug={orgSlug} 
                />
              </TableCell>
            </motion.tr>
          ))}
        </motion.tbody>
      </Table>
    </div>
  );
}
