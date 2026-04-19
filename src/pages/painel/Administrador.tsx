import { LayoutAutenticado } from "@/components/LayoutAutenticado";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PainelAdministrador() {
  return (
    <LayoutAutenticado>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Painel do Administrador</h2>
        <p className="text-muted-foreground">Gestão de usuários, sociedades, fornecedores e auditoria.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Em construção</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Esta área será implementada na <strong>Etapa 3 — Cadastros e Administração</strong>.
        </CardContent>
      </Card>
    </LayoutAutenticado>
  );
}
