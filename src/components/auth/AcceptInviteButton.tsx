"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { acceptInvitationAction } from "@/app/actions/member";
import { toast } from "sonner";
import { Loader2, LogOut, CheckCircle2 } from "lucide-react";
import { authClient } from "@/lib/auth/client";

interface AcceptInviteButtonProps {
  invitationId: string;
  isEmailMismatch: boolean;
  targetEmail: string;
  currentEmail?: string;
}

export function AcceptInviteButton({ 
  invitationId, 
  isEmailMismatch, 
  targetEmail, 
  currentEmail 
}: AcceptInviteButtonProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (cardRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(cardRef.current, 
          { 
            y: 20, 
            opacity: 0 
          },
          { 
            y: 0, 
            opacity: 1, 
            duration: 1, 
            ease: "expo.out",
            delay: 0.2
          }
        );
      });
      return () => ctx.revert();
    }
  }, []);

  const handleAccept = async () => {
    setIsPending(true);
    try {
      await acceptInvitationAction(invitationId);
      toast.success("Acesso confirmado à organização!");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao aceitar convite");
    } finally {
      setIsPending(false);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.reload();
  };

  if (isEmailMismatch) {
    return (
      <div 
        ref={cardRef} 
        className="w-full max-w-md p-8 bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl rounded-2xl shadow-2xl opacity-0"
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20">
            <LogOut className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Conflito de Identidade</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Este convite é restrito ao e-mail <span className="text-zinc-200 font-medium">{targetEmail}</span>. 
              Você está logado atualmente como <span className="text-zinc-200 font-medium">{currentEmail}</span>.
            </p>
          </div>
          
          <Button 
            variant="destructive" 
            className="w-full h-12 text-base font-medium transition-all hover:scale-[1.02]"
            onClick={handleLogout}
          >
            Sair e Trocar de Conta
          </Button>
          
          <p className="text-xs text-zinc-500">
            A proteção de dados da organização exige que o e-mail seja idêntico ao convidado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={cardRef} 
      className="w-full max-w-md p-8 bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl rounded-2xl shadow-2xl opacity-0"
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Convite Recebido</h1>
          <p className="text-zinc-400 text-sm">
            Clique no botão abaixo para ingressar e começar a colaborar com sua equipe.
          </p>
        </div>

        <Button 
          className="w-full h-12 text-base font-semibold bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70"
          onClick={handleAccept}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processando...
            </>
          ) : (
            "Aceitar e Ingressar no Dashboard"
          )}
        </Button>
        
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
          SaaS Multi-tenant Enterprise
        </p>
      </div>
    </div>
  );
}
