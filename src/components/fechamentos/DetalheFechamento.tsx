import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatarData, formatarMoeda } from "@/lib/format";
import {
  useMovimentacoesMes,
  type Fechamento,
} from "@/hooks/fechamentos/useFechamentos";
import { StatusFechamentoBadge } from "./StatusFechamentoBadge";
import { exportarCsv } from "@/lib/exportCsv";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fechamento: Fechamento | null;
  nomeSociedade?: string;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function DetalheFechamento({ open, onOpenChange, fechamento, nomeSociedade }: Props) {
  const { data: movs = [], isLoading } = useMovimentacoesMes(
    fechamento?.sociedade_id ?? null,
    fechamento?.ano ?? null,
    fechamento?.mes ?? null,
  );

  if (!fechamento) return null;

  const handleExportar = () => {
    exportarCsv(
      `fechamento-${fechamento.ano}-${String(fechamento.mes).padStart(2, "0")}.csv`,
      [
        { cabecalho: "Data", valor: (m) => formatarData(m.data_movimento) },
        { cabecalho: "Tipo", valor: (m) => m.tipo },
        { cabecalho: "Origem", valor: (m) => m.origem },
        { cabecalho: "Valor", valor: (m) => Number(m.valor).toFixed(2).replace(".", ",") },
        { cabecalho: "Observação", valor: (m) => m.observacao ?? "" },
      ],
      movs,
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <div className="flex items-center justify-between gap-2">
            <SheetTitle>
              {MESES[fechamento.mes - 1]} / {fechamento.ano}
            </SheetTitle>
            <StatusFechamentoBadge status={fechamento.status} />
          </div>
          <SheetDescription>
            {nomeSociedade ? `${nomeSociedade} • ` : ""}Detalhe das movimentações do mês
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Saldo inicial</p>
            <p className="text-sm font-semibold">{formatarMoeda(Number(fechamento.saldo_inicial))}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Entradas</p>
            <p className="text-sm font-semibold text-emerald-600">
              {formatarMoeda(Number(fechamento.total_entradas))}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Saídas</p>
            <p className="text-sm font-semibold text-rose-600">
              {formatarMoeda(Number(fechamento.total_saidas))}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Saldo final</p>
            <p className="text-sm font-semibold">{formatarMoeda(Number(fechamento.saldo_final))}</p>
          </div>
        </div>

        {fechamento.observacao && (
          <div className="mt-4 rounded-md border bg-muted/30 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Observação</p>
            <p className="whitespace-pre-line text-sm">{fechamento.observacao}</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Movimentações do mês</h3>
          <Button variant="outline" size="sm" onClick={handleExportar} disabled={movs.length === 0}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </div>

        <div className="mt-2 overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && movs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    Sem movimentações no mês.
                  </TableCell>
                </TableRow>
              )}
              {movs.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm">{formatarData(m.data_movimento)}</TableCell>
                  <TableCell className="text-sm capitalize">{m.tipo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.origem}</TableCell>
                  <TableCell
                    className={`text-right text-sm ${
                      m.tipo === "saida" ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {formatarMoeda(Number(m.valor))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
