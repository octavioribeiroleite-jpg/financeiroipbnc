import { LayoutAutenticado } from "@/components/LayoutAutenticado";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PainelCentral() {
  return (
    <LayoutAutenticado>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Painel da Tesouraria Central</h2>
        <p className="text-muted-foreground">Conferências, análise de solicitações e pagamentos.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Em construção</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Esta área será implementada nas próximas etapas (contribuições, solicitações, pagamentos).
        </CardContent>
      </Card>
    </LayoutAutenticado>
  );
}
