import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { BackupCodesDisplay } from "./backup-codes-display";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ShieldCheck, ShieldX, Smartphone, Key, RefreshCw, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";


export function TwoFactorSetup({ onEnabled }: { onEnabled: () => void }) {
  const t = useTranslations("Security");
  const [step, setStep] = useState<"initial" | "verify" | "backup">("initial");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [qrCodeUri, setQrCodeUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasConfirmedBackup, setHasConfirmedBackup] = useState(false);

  const startSetup = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.twoFactor.enable({
        password,
      });

      if (error) {
        toast.error(error.message || t("failedStartSetup"));
        return;
      }

      if (data && "totpURI" in data && "backupCodes" in data) {
        setQrCodeUri(data.totpURI as string);
        setBackupCodes(data.backupCodes as string[]);
        setStep("verify");
      }
    } catch {
      toast.error(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    setIsLoading(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: totpCode,
      });

      if (error) {
        toast.error(error.message || t("invalidCode"));
        return;
      }

      toast.success(t("verifiedSuccess"));
      setStep("backup");
    } catch {
      toast.error(t("failedVerify"));
    } finally {
      setIsLoading(false);
    }
  };

  const finishSetup = () => {
    onEnabled();
    setIsOpen(false);
    // Delay reset to allow exit animation to complete
    setTimeout(reset, 300);
  };

  const reset = () => {
    setStep("initial");
    setPassword("");
    setTotpCode("");
    setQrCodeUri("");
    setBackupCodes([]);
    setIsLoading(false);
  };

  const containerVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { staggerChildren: 0.1 } },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) reset();
    }}>
      <DialogTrigger asChild>
        <Button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-all duration-300 gap-2 group overflow-hidden relative">
          <Smartphone className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span>{t("enable2FA")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] bg-zinc-950 border-zinc-800 text-zinc-100 overflow-hidden shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {t("setup2FA")}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {t("backupCodesWarning")}
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[360px] mt-4">
          <AnimatePresence mode="wait">
            {step === "initial" && (
              <motion.div
                key="initial"
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Smartphone className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-center mb-2">{t("confirmPassword")}</h3>
                  <p className="text-sm text-zinc-400 text-center max-w-[280px]">
                    {t("enterCurrentPassword")}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-zinc-400">{t("confirmPassword")}</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100 h-11 focus:ring-primary/20"
                    />
                  </div>
                  <Button 
                    onClick={startSetup} 
                    disabled={isLoading || !password} 
                    className="w-full h-11 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 shadow-lg"
                  >
                    {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t("continue")}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "verify" && (
              <motion.div
                key="verify"
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6 flex flex-col items-center"
              >
                <div className="relative group p-4 bg-white rounded-2xl border-2 border-primary/10 shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent h-1/4 w-full top-0 animate-scan pointer-events-none" />
                  
                  <QRCodeSVG
                    value={qrCodeUri}
                    size={180}
                    level="H"
                    className="relative z-10"
                  />
                </div>
                
                <p className="text-sm text-center text-zinc-400 px-8">
                  {t("scanQRCode")}
                </p>

                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="totp" className="flex items-center gap-2 text-zinc-400">
                      <Key className="w-4 h-4 text-primary" />
                      {t("verificationCode")}
                    </Label>
                    <Input
                      id="totp"
                      placeholder="000 000"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100 h-12 text-center text-2xl tracking-[0.5em] font-mono focus:ring-primary/20"
                      maxLength={6}
                    />
                  </div>
                  <Button 
                    onClick={verifyAndEnable} 
                    disabled={isLoading || totpCode.length < 6} 
                    className="w-full h-11 bg-primary text-primary-foreground hover:opacity-90 shadow-lg"
                  >
                    {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t("verifyAndEnable")}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "backup" && (
              <motion.div
                key="backup"
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex gap-3 animate-in zoom-in-95 duration-500">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-emerald-200">
                      {t("verifiedSuccess") || "Security Verified!"}
                    </p>
                    <p className="text-xs text-emerald-200/60 leading-relaxed">
                      {t("backupCodesWarning")}
                    </p>
                  </div>
                </div>
                
                <div className="relative group">
                  <BackupCodesDisplay codes={backupCodes} />
                </div>

                <div className="flex items-start space-x-3 p-4 bg-zinc-900/40 rounded-lg border border-zinc-800/50 hover:bg-zinc-900/60 transition-colors cursor-pointer" onClick={() => setHasConfirmedBackup(!hasConfirmedBackup)}>
                  <Checkbox 
                    id="confirm-backup" 
                    checked={hasConfirmedBackup}
                    onCheckedChange={(checked) => setHasConfirmedBackup(checked as boolean)}
                    className="mt-1 border-zinc-700 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label 
                    htmlFor="confirm-backup" 
                    className="text-xs text-zinc-400 leading-normal cursor-pointer select-none"
                  >
                    I have safely stored these backup codes and understand they cannot be recovered if lost.
                  </Label>
                </div>

                <div className="pt-2">
                  <Button 
                    onClick={finishSetup}
                    disabled={!hasConfirmedBackup}
                    className="w-full h-11 bg-primary text-primary-foreground hover:opacity-90 shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all duration-300 disabled:opacity-50 disabled:grayscale"
                  >
                    {t("savedBackupCodes") || "Activate 2FA"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DisableTwoFactor({ onDisabled }: { onDisabled: () => void }) {
  const t = useTranslations("Security");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const disable = async () => {
    setIsLoading(true);
    try {
      const { error } = await authClient.twoFactor.disable({
        password,
      });

      if (error) {
        toast.error(error.message || t("failedDisable"));
        return;
      }

      toast.success(t("disabledSuccess"));
      onDisabled();
      setIsOpen(false);
    } catch {
      toast.error(t("failedDisable"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
          {t("disable2FA")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ShieldX className="h-5 w-5 text-red-500" />
            {t("disable2FA")}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {t("disable2FADescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="disable-password">{t("password")}</Label>
            <Input
              id="disable-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-zinc-100"
            />
          </div>
          <Button 
            onClick={disable} 
            disabled={isLoading || !password} 
            variant="destructive"
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("disable2FA")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
