import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Church } from "lucide-react";

const emailSchema = z.string().trim().email("E-mail inválido").max(255);
const senhaSchema = z.string().min(8, "Senha deve ter ao menos 8 caracteres").max(72);
const nomeSchema = z.string().trim().min(2, "Nome muito curto").max(120);

export default function Login() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [enviando, setEnviando] = useState(false);

  const [emailLogin, setEmailLogin] = useState("");
  const [senhaLogin, setSenhaLogin] = useState("");

  const [nomeCad, setNomeCad] = useState("");
  const [emailCad, setEmailCad] = useState("");
  const [senhaCad, setSenhaCad] = useState("");

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

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      nomeSchema.parse(nomeCad);
      emailSchema.parse(emailCad);
      senhaSchema.parse(senhaCad);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: "Dados inválidos", description: err.errors[0].message, variant: "destructive" });
      }
      return;
    }
    setEnviando(true);
    const { error } = await supabase.auth.signUp({
      email: emailCad,
      password: senhaCad,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nome: nomeCad },
      },
    });
    if (error) {
      setEnviando(false);
      toast({ title: "Falha ao cadastrar", description: error.message, variant: "destructive" });
      return;
    }
    // Faz signOut para evitar redirecionamento automático antes do usuário ver a confirmação.
    await supabase.auth.signOut();
    setEnviando(false);
    setNomeCad("");
    setEmailCad("");
    setSenhaCad("");
    toast({
      title: "Cadastro realizado com sucesso",
      description: "Aguarde o administrador atribuir seu perfil de acesso para entrar.",
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]">
            <Church className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Tesouraria Presbiteriana</h1>
          <p className="text-sm text-muted-foreground">Sistema de gestão financeira das sociedades internas</p>
        </div>

        <Card className="shadow-[var(--shadow-elegant)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Acesso ao sistema</CardTitle>
            <CardDescription>Entre com sua conta institucional ou solicite cadastro.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="entrar" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entrar">Entrar</TabsTrigger>
                <TabsTrigger value="cadastrar">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="entrar" className="mt-4">
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
              </TabsContent>

              <TabsContent value="cadastrar" className="mt-4">
                <form onSubmit={cadastrar} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome-cad">Nome completo</Label>
                    <Input
                      id="nome-cad"
                      type="text"
                      autoComplete="name"
                      value={nomeCad}
                      onChange={(e) => setNomeCad(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-cad">E-mail</Label>
                    <Input
                      id="email-cad"
                      type="email"
                      autoComplete="email"
                      value={emailCad}
                      onChange={(e) => setEmailCad(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha-cad">Senha</Label>
                    <Input
                      id="senha-cad"
                      type="password"
                      autoComplete="new-password"
                      value={senhaCad}
                      onChange={(e) => setSenhaCad(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={enviando}>
                    {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Solicitar cadastro
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Após o cadastro, o administrador atribuirá seu perfil de acesso.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
