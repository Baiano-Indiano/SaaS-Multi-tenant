"use client";

import { useState, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTranslations } from "next-intl";
import { Loader2, User, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";

interface UserProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function UserProfileForm({ user }: UserProfileFormProps) {
  const t = useTranslations("Account.profileSettings");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const formSchema = useMemo(() => z.object({
    name: z.string().min(2, t("validation.nameMin")),
  }), [t]);

  type FormValues = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
    },
  });

  useGSAP(() => {
    gsap.from(".settings-field", {
      y: 20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: "power2.out",
      clearProps: "all"
    });
  }, { scope: containerRef });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);

    try {
      const { error } = await authClient.updateUser({
        name: data.name,
      });

      if (!error) {
        toast.success(t("savedSuccess"));
        router.refresh();
      } else {
        toast.error(error.message || t("error"));
      }
    } catch {
      toast.error(t("error"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="grid gap-6">
      <Card className="bg-zinc-950 border-zinc-800 shadow-xl shadow-black/40">
        <CardHeader className="settings-field">
          <CardTitle className="text-zinc-100 font-bold tracking-tight">{t("title")}</CardTitle>
          <CardDescription className="text-zinc-400">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-2 settings-field">
                <Label htmlFor="name" className="text-zinc-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-500" />
                  {t("nameLabel")}
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 focus:ring-zinc-700 placeholder:text-zinc-600"
                  placeholder={t("namePlaceholder")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 font-medium mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2 settings-field opacity-60">
                <Label htmlFor="email" className="text-zinc-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  {t("emailLabel")}
                </Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="bg-zinc-900/50 border-zinc-800 text-zinc-400 cursor-not-allowed"
                />
                <p className="text-[10px] text-zinc-500 italic">
                  {t("emailNotice")}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-900 settings-field">
              <Button
                type="submit"
                disabled={isLoading || !isDirty}
                className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-all duration-300 font-semibold px-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  t("saveChanges")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
