import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SaldoSociedade } from "@/hooks/igreja/useSaldoPorSociedade";
import { formatarMoeda } from "@/lib/format";

interface Props {
  dados?: SaldoSociedade[];
  loading?: boolean;
}

export function TabelaSaldoSociedades({ dados, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Saldo por sociedade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sociedade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Entradas (mês)</TableHead>
                <TableHead className="text-right">Saídas (mês)</TableHead>
                <TableHead className="text-right">Saldo atual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!loading && (dados ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    Nenhuma sociedade cadastrada.
                  </TableCell>
                </TableRow>
              )}
              {(dados ?? []).map((s) => (
                <TableRow key={s.sociedadeId}>
                  <TableCell className="font-medium">{s.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{s.tipo}</TableCell>
                  <TableCell className="text-right text-emerald-600">
                    {formatarMoeda(s.entradasMes)}
                  </TableCell>
                  <TableCell className="text-right text-rose-600">
                    {formatarMoeda(s.saidasMes)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatarMoeda(s.saldoAtual)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
