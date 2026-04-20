import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PontoEvolucao } from "@/hooks/igreja/useEvolucaoMensal";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatarMoeda } from "@/lib/format";

interface Props {
  dados?: PontoEvolucao[];
  loading?: boolean;
}

export function GraficoEvolucao({ dados, loading }: Props) {
  const data = (dados ?? []).map((d) => ({
    rotulo: d.rotulo,
    Entradas: d.entradas,
    Saídas: d.saidas,
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolução mensal consolidada</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {loading || data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {loading ? "Carregando..." : "Sem dados."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="rotulo" tick={{ fontSize: 12 }} />
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
              <Line
                type="monotone"
                dataKey="Entradas"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Saídas"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
