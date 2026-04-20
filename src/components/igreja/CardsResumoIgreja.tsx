import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarMoeda } from "@/lib/format";
import { ResumoIgreja } from "@/hooks/igreja/useResumoIgreja";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  CheckCheck,
  AlertTriangle,
} from "lucide-react";

interface Props {
  resumo?: ResumoIgreja;
  loading?: boolean;
}

export function CardsResumoIgreja({ resumo, loading }: Props) {
  const itens = [
    {
      titulo: "Saldo consolidado",
      valor: formatarMoeda(resumo?.saldoConsolidado ?? 0),
      icone: Wallet,
      cor: "text-primary",
    },
    {
      titulo: "Entradas no mês",
      valor: formatarMoeda(resumo?.entradasMes ?? 0),
      icone: TrendingUp,
      cor: "text-emerald-600",
    },
    {
      titulo: "Saídas no mês",
      valor: formatarMoeda(resumo?.saidasMes ?? 0),
      icone: TrendingDown,
      cor: "text-rose-600",
    },
    {
      titulo: "Solicitações pendentes",
      valor: String(resumo?.solicitacoesPendentes ?? 0),
      icone: ClipboardList,
      cor: "text-amber-600",
    },
    {
      titulo: "Contribuições a conferir",
      valor: String(resumo?.contribuicoesPendentes ?? 0),
      icone: CheckCheck,
      cor: "text-blue-600",
    },
    {
      titulo: "Divergências",
      valor: String(resumo?.divergencias ?? 0),
      icone: AlertTriangle,
      cor: "text-rose-600",
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {itens.map((i) => (
        <Card key={i.titulo}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {i.titulo}
            </CardTitle>
            <i.icone className={`h-4 w-4 ${i.cor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{loading ? "—" : i.valor}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
