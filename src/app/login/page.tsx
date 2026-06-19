"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { LensMark } from "@/components/lens-mark";

export default function LoginPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && session) router.replace("/painel");
  }, [authLoading, session, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setSubmitting(false);
    if (signInError) {
      setError("E-mail ou senha incorretos. Verifique e tente novamente.");
      return;
    }
    router.replace("/painel");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Lado de marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-garnet-gradient p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="absolute -bottom-32 -left-10 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute right-16 top-1/3 h-40 w-40 rounded-full border border-white/10" />

        <div className="relative z-10 flex items-center gap-2.5">
          <LensMark className="h-7 w-12" />
          <span className="font-display text-xl font-bold tracking-tight">
            Ótica<span className="font-normal text-white/70">OS</span>
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="font-display text-3xl font-bold leading-tight">
            Foco no que importa: o cliente em frente ao balcão.
          </p>
          <p className="mt-4 text-white/75">
            Orçamentos, ordens de serviço, estoque e financeiro da sua ótica,
            organizados em um só lugar.
          </p>
        </div>

        <p className="relative z-10 text-sm text-white/50">
          © {new Date().getFullYear()} Sistema de Gestão para Óticas
        </p>
      </div>

      {/* Lado do formulário */}
      <div className="flex items-center justify-center bg-sand-100 p-8">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-xl2 bg-white p-8 shadow-card"
        >
          <div className="mb-1 flex items-center gap-2 lg:hidden">
            <LensMark className="h-6 w-10 text-garnet-500" />
            <span className="font-display text-lg font-bold text-ink-900">
              ÓticaOS
            </span>
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">
            Entrar
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Acesse o painel administrativo da sua ótica.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@suaotica.com.br"
                className="w-full rounded-lg border border-sand-300 bg-sand-50 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition focus:border-garnet-400 focus:ring-2 focus:ring-garnet-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-sand-300 bg-sand-50 px-3.5 py-2.5 pr-10 text-sm text-ink-900 outline-none transition focus:border-garnet-400 focus:ring-2 focus:ring-garnet-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-garnet-50 px-3 py-2 text-sm text-garnet-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-garnet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-pop transition hover:bg-garnet-600 disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Entrar
          </button>

          <p className="mt-6 text-center text-xs text-ink-300">
            Usuários são criados no painel do Supabase, em
            Authentication → Users.
          </p>
        </form>
      </div>
    </div>
  );
}
