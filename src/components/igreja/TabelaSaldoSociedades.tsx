import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SaldoSociedade } from "@/hooks/igreja/useSaldoPorSociedade";
import { formatarMoeda } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  dados?: SaldoSociedade[];
  loading?: boolean;
  sociedadeSelecionadaId?: string | null;
}

export function TabelaSaldoSociedades({ dados, loading, sociedadeSelecionadaId }: Props) {
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
                <TableHead className="text-right">Participação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!loading && (dados ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    Nenhuma sociedade cadastrada.
                  </TableCell>
                </TableRow>
              )}
              {(dados ?? []).map((s) => {
                const participacao = totalSaldoAtual > 0 ? (s.saldoAtual / totalSaldoAtual) * 100 : 0;
                const selecionada = sociedadeSelecionadaId === s.sociedadeId;

                return (
                  <TableRow key={s.sociedadeId} className={cn(selecionada && "bg-primary/5")}>
                    <TableCell className="font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        {s.nome}
                        {selecionada && (
                          <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                            em foco
                          </span>
                        )}
                      </div>
                    </TableCell>
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
                    <TableCell className="min-w-[150px] text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.max(0, Math.min(100, participacao))}%` }}
                          />
                        </div>
                        <span className="w-12 text-xs text-muted-foreground">
                          {participacao.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && (dados ?? []).length > 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-right font-semibold">
                    Saldo consolidado
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatarMoeda(totalSaldoAtual)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    100%
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
