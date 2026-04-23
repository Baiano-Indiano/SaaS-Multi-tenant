"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateOrganizationAction } from "@/app/actions/org";

const formSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  slug: z.string().min(2, "O slug deve ter pelo menos 2 caracteres").regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minúsculas, números e hifens"),
});

type FormValues = z.infer<typeof formSchema>;

interface OrganizationSettingsFormProps {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

export function OrganizationSettingsForm({ organization }: OrganizationSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization.name,
      slug: organization.slug || "",
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
      const result = await updateOrganizationAction(organization.id, data.name, data.slug);

      if (result.success) {
        toast.success("Organização atualizada com sucesso!");
        
        // If slug changed, we need to redirect to the new URL
        if (data.slug !== organization.slug) {
          router.push(`/org/${data.slug}/settings/general`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Ocorreu um erro ao atualizar a organização.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="grid gap-6">
      <Card className="bg-zinc-950 border-zinc-800 shadow-xl shadow-black/40">
        <CardHeader className="settings-field">
          <CardTitle className="text-zinc-100 font-bold tracking-tight">Organization Profile</CardTitle>
          <CardDescription className="text-zinc-400">
            Basic details about your team and how it appears to others.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-3 settings-field">
                <Label htmlFor="name" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Display Name
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  className="bg-zinc-900/50 border-zinc-800 text-zinc-100 focus:ring-1 focus:ring-zinc-700 h-11"
                  placeholder="Acme Corp"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-3 settings-field">
                <Label htmlFor="slug" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Organization URL (Slug)
                </Label>
                <div className="flex items-center group">
                  <div className="bg-zinc-900 border border-r-0 border-zinc-800 px-3 h-11 flex items-center rounded-l-md text-zinc-500 text-sm font-mono transition-colors group-focus-within:border-zinc-700">
                    /
                  </div>
                  <Input
                    id="slug"
                    {...register("slug")}
                    className="bg-zinc-900/50 border-zinc-800 text-zinc-100 focus:ring-1 focus:ring-zinc-700 rounded-l-none h-11 font-mono text-sm"
                    placeholder="acme-corp"
                  />
                </div>
                {errors.slug && (
                  <p className="text-xs text-red-500 font-medium">{errors.slug.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 settings-field border-t border-zinc-900/50 mt-4">
              <Button
                type="submit"
                disabled={isLoading || !isDirty}
                isLoading={isLoading}
                className="bg-zinc-100 text-zinc-950 hover:bg-white font-bold px-10 h-11 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
