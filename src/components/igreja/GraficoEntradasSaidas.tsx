import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SaldoSociedade } from "@/hooks/igreja/useSaldoPorSociedade";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatarMoeda } from "@/lib/format";

interface Props {
  dados?: SaldoSociedade[];
  loading?: boolean;
}

export function GraficoEntradasSaidas({ dados, loading }: Props) {
  const data = (dados ?? []).map((d) => ({
    nome: d.nome,
    Entradas: d.entradasMes,
    Saídas: d.saidasMes,
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Entradas × Saídas por sociedade (mês)</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {loading || data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {loading ? "Carregando..." : "Sem dados no período."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$ ${v}`} />
              <Tooltip
                formatter={(v: number) => formatarMoeda(v)}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
              <Legend />
              <Bar dataKey="Entradas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
