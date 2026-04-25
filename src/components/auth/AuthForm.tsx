"use client";

import { useEffect, useState, useRef } from "react";
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

const authSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Nome é obrigatório").optional(),
});

type AuthValues = z.infer<typeof authSchema>;

interface AuthFormProps {
  type: "login" | "register";
}

import { motion, AnimatePresence, type Variants } from "framer-motion";

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fieldVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2 + i * 0.08,
        duration: 0.6,
        ease: [0.215, 0.61, 0.355, 1] as const, // power3.out equivalent
      },
    }),
  };

  useGSAP(() => {
    // Entrance animation for the whole container
    gsap.to(containerRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power2.out"
    });
  }, { scope: containerRef });

  useGSAP(() => {
    if (loading) {
      // Start progress bar animation
      gsap.to(progressRef.current, {
        width: "70%",
        duration: 2,
        ease: "power2.out",
      });
    } else {
      // Complete and hide
      const tl = gsap.timeline();
      tl.to(progressRef.current, {
        width: "100%",
        duration: 0.3,
        ease: "power2.inOut",
      }).to(progressRef.current, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          gsap.set(progressRef.current, { width: "0%", opacity: 1 });
        }
      });
    }
  }, { dependencies: [loading], scope: containerRef });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
  });

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
        return "Nenhuma conta encontrada com este e-mail. Clique em \"Registre-se\" para criar sua conta.";
      }
      if (type === "login" && (lowered.includes("invalid") || lowered.includes("credentials"))) {
        return "E-mail ou senha inválidos.";
      }
      if (type === "register" && lowered.includes("already exists")) {
        return "Este e-mail já está cadastrado. Faça login.";
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
        const raw =
          typeof response.error === "string"
            ? response.error
            : response.error.message || response.error.code || "Falha na autenticação.";
        const mapped = mapAuthError(raw);
        throw new Error(mapped);
      }

      if (!response?.data?.user?.id) {
        const msg = type === "login"
          ? "Não foi possível entrar. Verifique suas credenciais."
          : "Não foi possível criar a conta. Tente novamente.";
        throw new Error(msg);
      }

      return response.data;
    })();

    toast.promise(authPromise, {
      loading: type === "login" ? "Verificando credenciais..." : "Criando sua conta...",
      success: () => {
        router.push("/selecionar-org");
        return type === "login" ? "Bem-vindo de volta!" : "Conta criada com sucesso!";
      },
      error: (err) => {
        const message = err.message;
        if (type === "login" && message.includes("Nenhuma conta encontrada")) {
          return {
            description: message,
            action: {
              label: "Registrar",
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

  return (
    <div
      ref={containerRef}
      className="w-full max-w-md opacity-0"
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
                {type === "login" ? "Entrar na conta" : "Criar uma conta"}
              </CardTitle>
              <CardDescription className="text-zinc-400 mt-1.5">
                {type === "login"
                  ? "Digite seu e-mail e senha para acessar sua conta."
                  : "Preencha os dados abaixo para começar sua jornada."}
              </CardDescription>
            </motion.div>
          </AnimatePresence>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 relative">
            <AnimatePresence mode="popLayout">
              {type === "register" && (
                <motion.div
                  key="name-field"
                  custom={0}
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-2 overflow-hidden"
                >
                  <Label htmlFor="name" className="text-zinc-300">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-zinc-700 h-10 transition-all focus:bg-zinc-900/80"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name.message}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              custom={type === "register" ? 1 : 0}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              <Label htmlFor="email" className="text-zinc-300">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-zinc-700 h-10 transition-all focus:bg-zinc-900/80"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </motion.div>

            <motion.div 
              custom={type === "register" ? 2 : 1}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              <Label htmlFor="password" className="text-zinc-300">
                Senha
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 relative">
            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-zinc-200 h-11 transition-all active:scale-[0.98]"
              isLoading={loading}
            >
              {type === "login" ? "Entrar" : "Cadastrar"}
            </Button>
            
            <div className="text-center text-sm text-zinc-500 italic">
              {type === "login" ? (
                <>
                  Não tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="text-zinc-300 hover:text-white hover:underline font-medium transition-colors"
                  >
                    Registre-se
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="text-zinc-300 hover:text-white hover:underline font-medium transition-colors"
                  >
                    Faça login
                  </button>
                </>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
