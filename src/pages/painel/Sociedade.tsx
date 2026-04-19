import { LayoutAutenticado } from "@/components/LayoutAutenticado";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PainelSociedade() {
  const { perfil } = useAuth();
  return (
    <LayoutAutenticado>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Painel da Sociedade</h2>
        <p className="text-muted-foreground">
          {perfil?.sociedade_id
            ? "Contribuições, solicitações de pagamento e fechamento mensal."
            : "Sua conta ainda não está vinculada a uma sociedade. Contate o administrador."}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Em construção</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Esta área será implementada nas próximas etapas (contribuições e solicitações).
        </CardContent>
      </Card>
    </LayoutAutenticado>
  );
}
