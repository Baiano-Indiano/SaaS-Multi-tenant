"use client";

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
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";

export function TwoFactorSetup({ onEnabled }: { onEnabled: () => void }) {
  const [step, setStep] = useState<"initial" | "verify" | "backup">("initial");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [qrCodeUri, setQrCodeUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const startSetup = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.twoFactor.enable({
        password,
      });

      if (error) {
        toast.error(error.message || "Failed to start 2FA setup");
        return;
      }

      if (data) {
        setQrCodeUri(data.totpURI);
        setBackupCodes(data.backupCodes);
        setStep("verify");
      }
    } catch {
      toast.error("An unexpected error occurred");
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
        toast.error(error.message || "Invalid verification code");
        return;
      }

      toast.success("Two-factor authentication verified!");
      setStep("backup");
      // onEnabled() is now called after backup code acknowledgment
    } catch {
      toast.error("Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  };

  const finishSetup = () => {
    onEnabled();
    setIsOpen(false);
    reset();
  };

  const reset = () => {
    setStep("initial");
    setPassword("");
    setTotpCode("");
    setQrCodeUri("");
    setBackupCodes([]);
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) reset();
    }}>
      <DialogTrigger render={
        <Button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-all duration-300">
          Enable 2FA
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            Set up Two-Factor Authentication
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Secure your account with TOTP (Time-based One-Time Password).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === "initial" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Confirm your password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100"
                />
              </div>
              <Button 
                onClick={startSetup} 
                disabled={isLoading || !password} 
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-6 flex flex-col items-center">
              <div className="p-4 bg-white rounded-lg">
                <QRCodeSVG value={qrCodeUri} size={200} />
              </div>
              <p className="text-sm text-center text-zinc-400 px-4">
                Scan the QR code with your authenticator app (like Google Authenticator or 1Password) and enter the 6-digit code below.
              </p>
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="totp">Verification Code</Label>
                  <Input
                    id="totp"
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 tracking-widest text-center text-lg"
                    maxLength={6}
                  />
                </div>
                <Button 
                  onClick={verifyAndEnable} 
                  disabled={isLoading || totpCode.length < 6} 
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify and Enable
                </Button>
              </div>
            </div>
          )}

          {step === "backup" && (
            <div className="space-y-6">
              <BackupCodesDisplay codes={backupCodes} />
              <div className="pt-2">
                <Button 
                  onClick={finishSetup}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  I have saved my backup codes
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DisableTwoFactor({ onDisabled }: { onDisabled: () => void }) {
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
        toast.error(error.message || "Failed to disable 2FA");
        return;
      }

      toast.success("Two-factor authentication disabled");
      onDisabled();
      setIsOpen(false);
    } catch {
      toast.error("Failed to disable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <Button variant="destructive" className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
          Disable 2FA
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ShieldX className="h-5 w-5 text-red-500" />
            Disable 2FA
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            This will make your account less secure. Please enter your password to confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="disable-password">Password</Label>
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
            Disable 2FA
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
