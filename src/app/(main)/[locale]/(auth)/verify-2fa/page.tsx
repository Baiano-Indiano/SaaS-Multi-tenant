"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { trustDeviceAction } from "@/app/actions/security";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isBackup, setIsBackup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isBackup) {
        const { error } = await authClient.twoFactor.verifyBackupCode({
          code,
          trustDevice,
        });
        if (error) {
          toast.error(error.message || "Invalid backup code");
          return;
        }
      } else {
        const { error } = await authClient.twoFactor.verifyTotp({
          code,
          trustDevice,
        });
        if (error) {
          toast.error(error.message || "Invalid verification code");
          return;
        }
      }

      toast.success("Identity verified!");

      if (trustDevice) {
        await trustDeviceAction().catch((err) =>
          console.error("Failed to establish device trust:", err)
        );
      }

      router.push("/selecionar-org");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-12">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Security Check
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Enter the code from your authenticator app to continue.
          </p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100">
              {isBackup ? "Backup Code" : "Two-Factor Authentication"}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {isBackup 
                ? "Enter one of your emergency recovery codes." 
                : "Open your authenticator app to see your verification code."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-zinc-300">
                  {isBackup ? "Backup Code" : "6-Digit Code"}
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder={isBackup ? "xxxxxxxx" : "000000"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 text-center text-lg tracking-widest focus:ring-emerald-500/20 focus:border-emerald-500/50"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center space-x-2 py-1">
                <input
                  id="trust-device"
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20"
                />
                <label htmlFor="trust-device" className="text-xs text-zinc-400 cursor-pointer select-none font-medium">
                  Lembrar deste dispositivo por 30 dias
                </label>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || code.length < (isBackup ? 8 : 6)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-300"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                Verify Identity
              </Button>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setIsBackup(!isBackup);
                    setCode("");
                  }}
                  className="w-full text-zinc-500 hover:text-zinc-300 text-xs flex items-center justify-center gap-2"
                >
                  <KeyRound className="h-3 w-3" />
                  {isBackup ? "Use authenticator app instead" : "Use a backup code"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-600">
          Trouble signing in? Contact your organization administrator.
        </p>
      </div>
    </div>
  );
}
