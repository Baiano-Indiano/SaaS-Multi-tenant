import { AuthForm } from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white mb-4">
            <span className="text-xl font-bold text-black">G</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Crie sua conta
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Junte-se à próxima geração de startups enterprise.
          </p>
        </div>
        <AuthForm type="register" />
      </div>
    </div>
  );
}
