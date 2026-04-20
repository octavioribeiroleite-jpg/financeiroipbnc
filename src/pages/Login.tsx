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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary/10 shadow-[var(--shadow-elegant)]">
            <img src="/favicon.png" alt="Tesouraria Presbiteriana" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Tesouraria Presbiteriana</h1>
          <p className="text-sm text-muted-foreground">Acesso exclusivo da operação financeira centralizada</p>
        </div>

        <Card className="shadow-[var(--shadow-elegant)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Acesso ao sistema</CardTitle>
            <CardDescription>Entre com a conta administradora para operar todas as sociedades.</CardDescription>
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
      </div>
    </div>
  );
}
