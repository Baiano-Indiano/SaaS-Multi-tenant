"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";
import { toast } from "sonner";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { checkSSOAvailabilityAction } from "@/app/actions/sso";

interface AuthFormProps {
  type: "login" | "register";
}

export function AuthForm({ type }: AuthFormProps) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showSSO, setShowSSO] = useState(false);
  const [ssoEmail, setSsoEmail] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [ssoAvailable, setSsoAvailable] = useState(false);
  const [detectedDomain, setDetectedDomain] = useState("");
  const [isCheckingSSO, setIsCheckingSSO] = useState(false);

  const authSchema = useMemo(() => z.object({
    email: z.string().email(t("invalidEmail")),
    password: z.string().min(6, t("passwordTooShort")),
    name: z.string().min(2, t("nameRequired")).optional(),
  }), [t]);

  type AuthValues = z.infer<typeof authSchema>;

  // GSAP will handle field entrance, removing Framer variants
  const entranceVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  useGSAP(() => {
    if (!containerRef.current) return;
    
    // Premium entrance animation
    const elements = containerRef.current.querySelector(".auth-card-content")?.children;
    if (elements) {
      gsap.from(elements, {
        opacity: 0,
        y: 20,
        blur: 10,
        scale: 0.98,
        duration: 0.8,
        stagger: 0.08,
        ease: "expo.out",
        delay: 0.2
      });
    }
  }, { scope: containerRef });

  useGSAP(() => {
    const el = progressRef.current;
    if (loading && el) {
      gsap.to(el, {
        width: "70%",
        duration: 1.5,
        ease: "power2.out",
        opacity: 1,
      });
    } else if (el) {
      const tl = gsap.timeline();
      tl.to(el, {
        width: "100%",
        duration: 0.4,
        ease: "expo.out",
      }).to(el, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          gsap.set(el, { width: "0%" });
        }
      });
    }
  }, { dependencies: [loading], scope: containerRef });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
  });

  const email = watch("email");

  // Detect SSO Domain
  useEffect(() => {
    if (type !== "login" || !email || !email.includes("@") || email.length < 5) {
      setSsoAvailable(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingSSO(true);
      try {
        const result = await checkSSOAvailabilityAction(email);
        if (result.available) {
          setSsoAvailable(true);
          setDetectedDomain(result.domain || "");
        } else {
          setSsoAvailable(false);
        }
      } catch (error) {
        console.error("SSO check failed:", error);
      } finally {
        setIsCheckingSSO(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [email, type]);

  useEffect(() => {
    const emailFromQuery = searchParams.get("email");
    if (type === "register" && emailFromQuery) {
      setValue("email", emailFromQuery);
    }
  }, [searchParams, setValue, type]);

  const onSubmit = async (values: AuthValues) => {
    setLoading(true);

    const mapAuthError = (raw: string) => {
      const lowered = raw.toLowerCase();
      if (type === "login" && lowered.includes("user not found")) {
        return t("userNotFound");
      }
      if (type === "login" && (lowered.includes("invalid") || lowered.includes("credentials"))) {
        return t("invalidCredentials");
      }
      if (type === "register" && lowered.includes("already exists")) {
        return t("emailAlreadyRegistered");
      }
      return raw;
    };

    const authPromise = (async () => {
      let response;
      if (type === "login") {
        response = await authClient.signIn.email({
          email: values.email,
          password: values.password,
        });
      } else {
        response = await authClient.signUp.email({
          email: values.email,
          password: values.password,
          name: values.name || "",
        });
      }

      if (response?.error) {
        // If 2FA is required, it's not an error in this flow, it's a redirect state
        if (response.error.code === "TWO_FACTOR_REQUIRED") {
          return { twoFactorRequired: true };
        }

        const raw =
          typeof response.error === "string"
            ? response.error
            : response.error.message || response.error.code || t("authFailed");
        const mapped = mapAuthError(raw);
        throw new Error(mapped);
      }

      const data = response?.data;
      if (type === "login" && data && (
        ('twoFactorRequired' in data && (data as { twoFactorRequired?: boolean }).twoFactorRequired) || 
        ('twoFactorRedirect' in data && (data as { twoFactorRedirect?: boolean }).twoFactorRedirect)
      )) {
        return { twoFactorRequired: true };
      }

      if (!data?.user?.id) {
        const msg = type === "login"
          ? t("couldNotSignIn")
          : t("couldNotCreateAccount");
        throw new Error(msg);
      }

      return data;
    })();

    toast.promise(authPromise, {
      loading: type === "login" ? t("verifyingCredentials") : t("creatingAccount"),
      success: (data) => {
        if (data && 'twoFactorRequired' in data && data.twoFactorRequired) {
          router.push("/verify-2fa");
          return t("twoFactorRequiredToast"); // We might need to add this to i18n
        }
        router.push("/selecionar-org");
        return type === "login" ? t("welcomeBackToast") : t("accountCreatedToast");
      },
      error: (err) => {
        const message = err.message;
        if (type === "login" && message === t("userNotFound")) {
          return {
            description: message,
            action: {
              label: t("registerLink"),
              onClick: () => router.push(`/register?email=${encodeURIComponent(values.email)}`),
            },
          };
        }
        return message;
      },
    });

    try {
      await authPromise;
    } catch {
      // Erro já capturado no authPromise e exibido via toast
    } finally {
      setLoading(false);
    }
  };

  const onSSOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssoEmail) return;

    setLoading(true);
    try {
      await authClient.signIn.sso({
        email: ssoEmail,
        callbackURL: "/selecionar-org",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("authFailed");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full max-w-md"
    >
      <Card className="w-full border-zinc-800 bg-zinc-950/50 backdrop-blur-sm shadow-2xl relative overflow-hidden group">
        {/* GSAP Progress Bar */}
        <div
          ref={progressRef}
          className="absolute top-0 left-0 h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] z-50 w-0"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-500/5 to-transparent pointer-events-none" />

        <CardHeader className="space-y-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={type}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <CardTitle className="text-2xl font-bold tracking-tight text-white">
                {type === "login" ? t("loginTitle") : t("registerTitle")}
              </CardTitle>
              <CardDescription className="text-zinc-400 mt-1.5">
                {type === "login"
                  ? t("loginDescription")
                  : t("registerDescription")}
              </CardDescription>
            </motion.div>
          </AnimatePresence>
        </CardHeader>
        <AnimatePresence mode="wait">
          {!showSSO ? (
            <motion.div
              key="standard-form"
              variants={entranceVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4 relative auth-card-content">
                  <AnimatePresence mode="popLayout">
                    {type === "register" && (
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-zinc-300">
                          {t("nameLabel")}
                        </Label>
                        <Input
                          id="name"
                          placeholder={t("namePlaceholder")}
                          className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-zinc-700 h-10 transition-all focus:bg-zinc-900/80"
                          {...register("name")}
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500">{errors.name.message}</p>
                        )}
                      </div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-300">
                      {t("emailLabel")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-zinc-700 h-10 transition-all focus:bg-zinc-900/80"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    {!ssoAvailable ? (
                      <motion.div
                        key="password-field"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        <Label htmlFor="password" className="text-zinc-300">
                          {t("passwordLabel")}
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-zinc-700 h-10 transition-all focus:bg-zinc-900/80"
                          {...register("password")}
                        />
                        {errors.password && (
                          <p className="text-xs text-red-500">{errors.password.message}</p>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="sso-hint"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3"
                      >
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">Enterprise SSO Ativo</p>
                          <p className="text-[10px] text-zinc-500">Faça login com sua conta corporativa de {detectedDomain}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto text-[10px] h-7 px-2 text-zinc-400 hover:text-white"
                          onClick={() => setSsoAvailable(false)}
                        >
                          Usar senha
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 relative">
                  <Button
                    type="submit"
                    className="w-full h-11 bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98]"
                    isLoading={loading || isCheckingSSO}
                    onClick={(e) => {
                      if (ssoAvailable) {
                        e.preventDefault();
                        setSsoEmail(email);
                        onSSOSubmit(e);
                      }
                    }}
                  >
                    {ssoAvailable 
                      ? `Entrar com SSO` 
                      : (type === "login" ? t("signInButton") : t("signUpButton"))}
                  </Button>

                  {type === "login" && (
                    <div className="w-full space-y-4">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-zinc-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-zinc-950 px-2 text-zinc-500">{t("orUse")}</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-900 hover:text-white h-11"
                        onClick={() => setShowSSO(true)}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        {t("enterpriseSSO")}
                      </Button>
                    </div>
                  )}

                  <div className="text-center text-sm text-zinc-500 italic">
                    {type === "login" ? (
                      <>
                        {t("noAccount")}{" "}
                        <button
                          type="button"
                          onClick={() => router.push("/register")}
                          className="text-zinc-300 hover:text-white hover:underline font-medium transition-colors"
                        >
                          {t("registerLink")}
                        </button>
                      </>
                    ) : (
                      <>
                        {t("hasAccount")}{" "}
                        <button
                          type="button"
                          onClick={() => router.push("/login")}
                          className="text-zinc-300 hover:text-white hover:underline font-medium transition-colors"
                        >
                          {t("loginLink")}
                        </button>
                      </>
                    )}
                  </div>
                </CardFooter>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="sso-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={onSSOSubmit}>
                <CardContent className="space-y-4 relative">
                  <div className="space-y-2">
                    <Label htmlFor="sso-email" className="text-zinc-300">
                      {t("corporateEmail")}
                    </Label>
                    <Input
                      id="sso-email"
                      type="email"
                      placeholder={t("corporateEmailPlaceholder")}
                      className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-zinc-700 h-11 transition-all focus:bg-zinc-900/80"
                      value={ssoEmail}
                      onChange={(e) => setSsoEmail(e.target.value)}
                      required
                    />
                    <p className="text-xs text-zinc-500">
                      {t("ssoRedirectNotice")}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 relative">
                  <Button
                    type="submit"
                    className="w-full bg-white text-black hover:bg-zinc-200 h-11 transition-all active:scale-[0.98]"
                    isLoading={loading}
                  >
                    {t("continueSSO")}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setShowSSO(false)}
                    className="text-sm text-zinc-500 hover:text-white transition-colors"
                  >
                    {t("backToLogin")}
                  </button>
                </CardFooter>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
