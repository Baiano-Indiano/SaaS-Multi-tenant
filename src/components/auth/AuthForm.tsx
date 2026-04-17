"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2 } from "lucide-react";

const authSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Nome é obrigatório").optional(),
});

type AuthValues = z.infer<typeof authSchema>;

interface AuthFormProps {
  type: "login" | "register";
}

import { motion, AnimatePresence } from "framer-motion";

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (values: AuthValues) => {
    setLoading(true);
    setError(null);
    try {
      if (type === "login") {
        await authClient.signIn.email({
          email: values.email,
          password: values.password,
        });
      } else {
        await authClient.signUp.email({
          email: values.email,
          password: values.password,
          name: values.name || "",
        });
      }
      router.push("/selecionar-org");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      <Card className="w-full border-zinc-800 bg-zinc-950/50 backdrop-blur-sm shadow-2xl relative overflow-hidden group">
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
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-md bg-red-900/20 p-3 text-sm text-red-400 border border-red-900/50 overflow-hidden"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="popLayout">
              {type === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
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

            <div className="space-y-2">
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
            </div>

            <div className="space-y-2">
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
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 relative">
            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-zinc-200 h-11 transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
    </motion.div>
  );
}
