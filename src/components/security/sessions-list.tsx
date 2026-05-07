"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth/client";
import { 
  Monitor, 
  Smartphone, 
  Globe, 
  LogOut, 
  Loader2, 
  MoreVertical,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useTranslations, useLocale } from "next-intl";

interface Session {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  token: string;
  userId: string;
}

export function SessionsList() {
  const t = useTranslations("Security");
  const locale = useLocale();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.multiSession.listDeviceSessions();
      if (error) {
        toast.error(t("failedLoad"));
        return;
      }
      if (data) {
        const mappedSessions: Session[] = data.map(d => ({
          id: d.session.id,
          userId: d.session.userId,
          token: d.session.token,
          expiresAt: new Date(d.session.expiresAt),
          createdAt: new Date(d.session.createdAt),
          updatedAt: new Date(d.session.updatedAt),
          ipAddress: d.session.ipAddress ?? null,
          userAgent: d.session.userAgent ?? null,
        }));
        
        setSessions(mappedSessions);
      }

      const session = await authClient.getSession();
      if (session.data) {
        setCurrentSessionId(session.data.session.id);
      }
    } catch {
      // Error is silently handled
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const revokeSession = async (token: string, sessionId: string) => {
    setIsRevoking(sessionId);
    try {
      const { error } = await authClient.multiSession.revoke({
        sessionToken: token
      });
      
      if (error) {
        toast.error(error.message || t("failedRevoke"));
        return;
      }

      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch {
      toast.error(t("genericError"));
    } finally {
      setIsRevoking(null);
    }
  };

  const revokeAllOtherSessions = async () => {
    setIsLoading(true);
    try {
      const { error } = await authClient.revokeOtherSessions();
      
      if (error) {
        toast.error(error.message || t("failedRevoke"));
        return;
      }

      toast.success(t("sessionsRevoked"));
      await fetchSessions();
    } catch {
      toast.error(t("unexpectedError"));
    } finally {
      setIsLoading(false);
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
    if (!userAgent) return t("unknownDevice");
    if (userAgent.includes("Chrome")) return t("chrome");
    if (userAgent.includes("Firefox")) return t("firefox");
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return t("safari");
    if (userAgent.includes("Postman")) return t("postman");
    return userAgent.split(" ").slice(0, 2).join(" ");
  };

  if (isLoading && sessions.length === 0) {
    return (
      <Card className="bg-zinc-950/40 border-zinc-900">
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-950/40 border-zinc-900 shadow-xl overflow-hidden">
      <CardHeader className="border-b border-zinc-900/50 bg-zinc-900/20 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Monitor className="h-5 w-5 text-zinc-400" />
            {t("sessions")}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {t("sessionsDescription")}
          </CardDescription>
        </div>
        {sessions.length > 1 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={revokeAllOtherSessions}
            disabled={isLoading}
            className="border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs"
          >
            {t("revokeAllOthers")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-zinc-900">
          {sessions.map((session) => (
            <div key={session.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${session.id === currentSessionId ? "bg-emerald-500/10" : "bg-zinc-800/50"}`}>
                  {getDeviceIcon(session.userAgent)}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200">
                      {parseUserAgent(session.userAgent)}
                    </span>
                    {session.id === currentSessionId && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] py-0 px-1.5">
                        {t("thisDevice")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{session.ipAddress || t("unknownIP")}</span>
                    <span>•</span>
                    <span>{t("started")} {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true, locale: dateLocale })}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {session.id !== currentSessionId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-100">
                      <DropdownMenuItem 
                        onClick={() => revokeSession(session.token, session.id)}
                        className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer"
                        disabled={isRevoking === session.id}
                      >
                        {isRevoking === session.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <LogOut className="h-4 w-4 mr-2" />
                        )}
                        {t("signOutDevice")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {sessions.length === 0 && (
          <div className="p-12 text-center space-y-2">
            <XCircle className="h-8 w-8 text-zinc-700 mx-auto" />
            <p className="text-sm text-zinc-500">{t("noneFound")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
