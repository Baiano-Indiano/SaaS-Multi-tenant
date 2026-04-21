"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, Zap, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { PlanId } from "@/lib/billing/plans";

interface UpgradeModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title?: string;
  reason?: string;
  requiredPlan?: PlanId;
}

export function UpgradeModal({
  isOpen,
  setIsOpen,
  title = "Limite de Plano Atingido",
  reason = "Você atingiu o limite do seu plano atual. Faça o upgrade agora para continuar escalando sem barreiras.",
}: UpgradeModalProps) {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const handleUpgrade = () => {
    setIsOpen(false);
    if (orgSlug) {
      router.push(`/org/${orgSlug}/billing`);
    } else {
      router.push(`/selecionar-org`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none bg-white dark:bg-zinc-950">
        <div className="relative p-6 pt-12">
          {/* Animated Background Element */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-200 via-zinc-800 to-zinc-200 dark:from-zinc-800 dark:via-zinc-200 dark:to-zinc-800" />
          
          <div className="flex flex-col items-center text-center space-y-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-2"
            >
              <Zap className="w-8 h-8 text-zinc-900 dark:text-zinc-50" />
            </motion.div>

            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {title}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 dark:text-zinc-400 text-base">
                {reason}
              </DialogDescription>
            </DialogHeader>

            <div className="w-full space-y-3 py-4">
              {[
                "Projetos e membros ilimitados",
                "Roles e permissões customizadas",
                "Analytics avançado em tempo real",
                "Suporte prioritário 24/7"
              ].map((feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-center space-x-3 text-sm text-zinc-600 dark:text-zinc-400"
                >
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
                  <span>{feature}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col w-full space-y-3 pt-2">
              <Button 
                onClick={handleUpgrade}
                size="lg"
                className="w-full bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 font-semibold"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Ver Planos e Preços
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsOpen(false)}
                className="w-full text-zinc-500 hover:text-zinc-900"
              >
                Talvez mais tarde
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
