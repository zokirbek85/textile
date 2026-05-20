"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Factory, Loader2 } from "lucide-react";
import { useLogin } from "@/hooks/useAuth";
import { useT } from "@/lib/i18n";

type FormValues = { email: string; password: string };

export default function LoginPage() {
  const t = useT();
  const login = useLogin();

  const schema = z.object({
    email: z.string().email(t.auth.emailInvalid),
    password: z.string().min(1, t.auth.passwordRequired),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
              <Factory className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Textile ERP</h1>
            <p className="text-sm text-muted-foreground mt-1">{t.auth.signInSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit((d) => login.mutate(d))} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t.auth.email}</label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="you@textile.uz"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">{t.auth.password}</label>
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {login.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {login.isPending ? t.auth.signingIn : t.auth.signIn}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Textile Manufacturing ERP · v1.0
        </p>
      </div>
    </div>
  );
}
