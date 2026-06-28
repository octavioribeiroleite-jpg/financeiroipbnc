import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { LogoTesouraria } from "@/components/brand/LogoTesouraria";
import { BotaoAtualizar } from "@/components/BotaoAtualizar";

const emailSchema = z.string().trim().email("E-mail inválido").max(255);
const senhaSchema = z.string().min(8, "Senha deve ter ao menos 8 caracteres").max(72);

export default function Login() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [enviando, setEnviando] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="fixed right-3 top-[max(12px,env(safe-area-inset-top))] z-50">
        <BotaoAtualizar className="border border-border/70 bg-card/95 shadow-card backdrop-blur" />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoTesouraria variant="vertical" theme="light" size="lg" />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Painel financeiro institucional da Igreja Presbiteriana.
          </p>
        </div>

        <Card className="border-border/70 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Acesso ao sistema</CardTitle>
            <CardDescription>
              Use a conta administradora vinculada à tesouraria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={entrar} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-login">E-mail</Label>
                <Input
                  id="email-login"
                  type="email"
                  autoComplete="email"
                  value={emailLogin}
                  onChange={(e) => setEmailLogin(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha-login">Senha</Label>
                <Input
                  id="senha-login"
                  type="password"
                  autoComplete="current-password"
                  value={senhaLogin}
                  onChange={(e) => setSenhaLogin(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={enviando}>
                {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Tesouraria Presbiteriana · acesso restrito
        </p>
      </div>
    </div>
  );
}
