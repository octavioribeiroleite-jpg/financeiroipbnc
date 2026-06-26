import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SaldoSociedade } from "@/hooks/igreja/useSaldoPorSociedade";
import { formatarMoeda } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  dados?: SaldoSociedade[];
  loading?: boolean;
}

export function TabelaSaldoSociedades({ dados, loading }: Props) {
  const totalSaldoAtual = (dados ?? []).reduce((acc, s) => acc + s.saldoAtual, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cofrinhos por sociedade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sociedade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Saldo inicial</TableHead>
                <TableHead className="text-right">Entradas (mês)</TableHead>
                <TableHead className="text-right">Saídas (mês)</TableHead>
                <TableHead className="text-right">Saldo final (mês)</TableHead>
                <TableHead className="text-right">Saldo atual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!loading && (dados ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    Nenhuma sociedade cadastrada.
                  </TableCell>
                </TableRow>
              )}
              {(dados ?? []).map((s) => (
                <TableRow key={s.sociedadeId}>
                  <TableCell className="font-medium">{s.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{s.tipo}</TableCell>
                  <TableCell className="text-right">
                    {formatarMoeda(s.saldoInicial)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600">
                    {formatarMoeda(s.entradasMes)}
                  </TableCell>
                  <TableCell className="text-right text-rose-600">
                    {formatarMoeda(s.saidasMes)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium",
                      s.saldoFinalMes < 0 && "text-destructive",
                    )}
                  >
                    {formatarMoeda(s.saldoFinalMes)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatarMoeda(s.saldoAtual)}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && (dados ?? []).length > 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-right font-semibold">
                    Saldo consolidado
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatarMoeda(totalSaldoAtual)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
