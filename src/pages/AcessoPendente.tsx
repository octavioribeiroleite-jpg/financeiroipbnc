import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Clock } from "lucide-react";

export default function AcessoPendente() {
  const { perfil, signOut } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/15 text-warning">
          <Clock className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Cadastro em análise</h1>
        <p className="mb-2 text-muted-foreground">
          Olá{perfil?.nome ? `, ${perfil.nome}` : ""}. Seu cadastro foi recebido e aguarda a atribuição de um perfil de
          acesso pelo administrador da tesouraria.
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          Você será notificado assim que seu acesso for liberado.
        </p>
        <Button variant="outline" onClick={signOut}>
          Sair
        </Button>
      </div>
    </div>
  );
}
