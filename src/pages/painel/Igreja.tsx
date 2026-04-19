import { LayoutAutenticado } from "@/components/LayoutAutenticado";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PainelIgreja() {
  return (
    <LayoutAutenticado>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Painel da Tesouraria da Igreja</h2>
        <p className="text-muted-foreground">Visão consolidada de todas as sociedades.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Em construção</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Esta área será implementada nas próximas etapas (relatórios e consolidação).
        </CardContent>
      </Card>
    </LayoutAutenticado>
  );
}
