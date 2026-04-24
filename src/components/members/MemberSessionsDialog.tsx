"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Monitor, 
  Smartphone, 
  Globe, 
  LogOut, 
  Loader2, 
  ShieldAlert,
  History,
  XCircle,
  MoreVertical
} from "lucide-react";
import { 
  listMemberSessionsAction, 
  revokeMemberSessionAction, 
  revokeMemberSessionsAction 
} from "@/app/actions/security";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface Session {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  token: string;
}

interface MemberSessionsDialogProps {
  member: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  orgId: string;
}

export function MemberSessionsDialog({ member, orgId }: MemberSessionsDialogProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listMemberSessionsAction(orgId, member.user.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSessions(result.sessions as unknown as Session[]);
    } catch {
      toast.error("Erro ao carregar sessões");
    } finally {
      setIsLoading(false);
    }
  }, [orgId, member.user.id]);

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen, fetchSessions]);

  const handleRevokeSingle = async (sessionId: string) => {
    setIsRevoking(sessionId);
    try {
      const result = await revokeMemberSessionAction(
        orgId, 
        member.user.id, 
        sessionId, 
        member.user.email
      );
      
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Sessão revogada");
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch {
      toast.error("Erro ao revogar sessão");
    } finally {
      setIsRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    setIsRevokingAll(true);
    try {
      const result = await revokeMemberSessionsAction(
        orgId, 
        member.user.id, 
        member.user.email
      );
      
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Todas as sessões revogadas");
      setSessions([]);
    } catch {
      toast.error("Erro ao revogar sessões");
    } finally {
      setIsRevokingAll(false);
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Globe className="h-4 w-4" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobi") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const parseUserAgent = (userAgent: string | null) => {
    if (!userAgent) return "Unknown Device";
    if (userAgent.includes("Chrome")) return "Chrome on Desktop";
    if (userAgent.includes("Firefox")) return "Firefox on Desktop";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari on Desktop";
    return userAgent.split(" ").slice(0, 2).join(" ");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 px-3 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-all group"
        >
          <History className="h-4 w-4 group-hover:scale-110 transition-transform" />
          <span className="ml-2 hidden sm:inline">Sessions</span>
        </Button>
      } />
      <DialogContent className="bg-zinc-950 border-zinc-800 shadow-2xl max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-900/50 bg-zinc-900/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                Manage Sessions
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Viewing active device sessions for <span className="text-zinc-200 font-medium">{member.user.name}</span>.
              </DialogDescription>
            </div>
            {sessions.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleRevokeAll}
                disabled={isRevokingAll || isLoading}
                className="h-8 text-xs font-bold"
              >
                {isRevokingAll ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <LogOut className="h-3 w-3 mr-2" />}
                Revoke All
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              <p className="text-xs text-zinc-500 animate-pulse font-medium">Fetching active devices...</p>
            </div>
          ) : sessions.length > 0 ? (
            <div className="divide-y divide-zinc-900">
              {sessions.map((session) => (
                <div key={session.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                      {getDeviceIcon(session.userAgent)}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-200">
                          {parseUserAgent(session.userAgent)}
                        </span>
                        <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px] py-0 px-1.5 font-normal">
                          {session.ipAddress || "Unknown IP"}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-medium">
                        Last seen {formatDistanceToNow(new Date(session.updatedAt))} ago
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl">
                      <DropdownMenuItem 
                        onClick={() => handleRevokeSingle(session.id)}
                        className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer text-xs font-bold"
                        disabled={isRevoking === session.id}
                      >
                        {isRevoking === session.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                        ) : (
                          <LogOut className="h-3.5 w-3.5 mr-2" />
                        )}
                        Terminate Session
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center space-y-3 bg-zinc-900/10">
              <div className="p-3 bg-zinc-900/50 rounded-full w-fit mx-auto border border-zinc-800">
                <XCircle className="h-6 w-6 text-zinc-700" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-zinc-400 font-medium">No active sessions</p>
                <p className="text-xs text-zinc-600">This member is not currently logged in on any device.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-900/30 border-t border-zinc-900/50">
          <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
            Revoking a session will immediately sign the member out of that device. 
            All unsaved progress on that device will be lost.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
