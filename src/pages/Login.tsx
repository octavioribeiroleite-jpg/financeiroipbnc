import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogoTesouraria } from "@/components/brand/LogoTesouraria";
import { BarChart3, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

const emailSchema = z.string().trim().email("E-mail inválido").max(255);
const senhaSchema = z.string().min(8, "Senha deve ter ao menos 8 caracteres").max(72);

export default function Login() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [enviando, setEnviando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [emailLogin, setEmailLogin] = useState("");
  const [senhaLogin, setSenhaLogin] = useState("");

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(emailLogin);
      senhaSchema.parse(senhaLogin);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: "Dados inválidos", description: err.errors[0].message, variant: "destructive" });
      }
      return;
    }

    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailLogin, password: senhaLogin });
    setEnviando(false);

    if (error) {
      toast({ title: "Falha ao entrar", description: error.message, variant: "destructive" });
      return;
    }

    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(420px,0.9fr)_minmax(540px,1.1fr)]">
      <section className="relative hidden overflow-hidden bg-brand-navy-900 px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-16">
        <div className="absolute inset-0 opacity-35" aria-hidden="true">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full border border-brand-gold-500/25" />
          <div className="absolute -left-8 -top-8 h-52 w-52 rounded-full border border-brand-gold-500/20" />
          <div className="absolute bottom-[-140px] right-[-100px] h-[420px] w-[420px] rounded-full bg-brand-navy-700/45 blur-2xl" />
        </div>

        <div className="relative z-10">
          <LogoTesouraria variant="horizontal" theme="dark" size="lg" />
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <BarChart3 className="h-6 w-6 text-brand-gold-400" />
          </div>
          <h1 className="max-w-lg text-4xl font-bold leading-tight tracking-[-0.04em] xl:text-5xl">
            Gestão financeira com organização e transparência.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300 xl:text-lg">
            Um ambiente seguro para acompanhar entradas, pagamentos, saldos, fechamentos e relatórios das sociedades.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-sm text-slate-400">
          <ShieldCheck className="h-4 w-4 text-brand-gold-400" />
          Acesso restrito à operação financeira autorizada.
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:min-h-0 lg:px-12 xl:px-20">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <LogoTesouraria variant="horizontal" theme="light" size="md" />
          </div>

          <div className="mb-7">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-brand-gold-600">Área segura</p>
            <h2 className="text-3xl font-bold tracking-[-0.035em] text-foreground">Acesso ao sistema</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Entre com sua conta para acessar o painel correspondente ao seu perfil.
            </p>
          </div>

          <form onSubmit={entrar} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email-login" className="text-sm font-semibold">
                E-mail
              </Label>
              <Input
                id="email-login"
                type="email"
                autoComplete="email"
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
                placeholder="nome@exemplo.com"
                required
                className="h-12 rounded-xl bg-card px-4 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha-login" className="text-sm font-semibold">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="senha-login"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  value={senhaLogin}
                  onChange={(e) => setSenhaLogin(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  className="h-12 rounded-xl bg-card px-4 pr-12 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((valor) => !valor)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-12 w-full rounded-xl text-sm font-semibold shadow-sm" disabled={enviando}>
              {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>

          <div className="mt-7 flex items-start gap-3 rounded-xl border border-border/80 bg-card p-4 text-sm text-muted-foreground shadow-card">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold-600" />
            <p className="leading-relaxed">
              Seus dados são protegidos. Não compartilhe sua senha ou o PIN de desbloqueio com outras pessoas.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
