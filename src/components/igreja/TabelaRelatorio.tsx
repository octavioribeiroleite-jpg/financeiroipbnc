import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { ColunaCsv, exportarCsv } from "@/lib/exportCsv";

export interface ColunaTabela<T> {
  cabecalho: string;
  render: (row: T) => ReactNode;
  /** Valor para exportação CSV (default: render como string). */
  valorCsv?: (row: T) => unknown;
  alinhamento?: "left" | "right" | "center";
}

interface Props<T> {
  titulo: string;
  colunas: ColunaTabela<T>[];
  dados: T[];
  loading?: boolean;
  nomeArquivo: string;
  rodape?: ReactNode;
  acoes?: ReactNode;
}

export function TabelaRelatorio<T>({
  titulo,
  colunas,
  dados,
  loading,
  nomeArquivo,
  rodape,
  acoes,
}: Props<T>) {
  const handleExport = () => {
    const cols: ColunaCsv<T>[] = colunas.map((c) => ({
      cabecalho: c.cabecalho,
      valor: c.valorCsv ?? ((row) => {
        const r = c.render(row);
        return typeof r === "string" || typeof r === "number" ? r : "";
      }),
    }));
    exportarCsv(nomeArquivo, cols, dados);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">{titulo}</CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {acoes}
          <Button size="sm" variant="outline" onClick={handleExport} disabled={dados.length === 0}>
            <Download className="mr-1 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 md:hidden">
          {loading && (
            <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          )}
          {!loading && dados.length === 0 && (
            <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">
              Nenhum registro encontrado.
            </div>
          )}
          {dados.map((row, i) => {
            const primeira = colunas[0];
            const restantes = colunas.slice(1);

            return (
              <div key={i} className="rounded-md border p-4">
                {primeira && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {primeira.cabecalho}
                    </p>
                    <div className="mt-1 break-words text-base font-semibold text-foreground">
                      {primeira.render(row)}
                    </div>
                  </div>
                )}
                {restantes.length > 0 && (
                  <div className="mt-3 grid gap-3 border-t pt-3">
                    {restantes.map((c) => (
                      <div key={c.cabecalho} className="grid grid-cols-[minmax(92px,0.8fr)_minmax(0,1.2fr)] gap-3 text-sm">
                        <span className="text-muted-foreground">{c.cabecalho}</span>
                        <span className="min-w-0 break-words text-right font-medium">{c.render(row)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                {colunas.map((c) => (
                  <TableHead
                    key={c.cabecalho}
                    className={c.alinhamento === "right" ? "text-right" : c.alinhamento === "center" ? "text-center" : ""}
                  >
                    {c.cabecalho}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={colunas.length} className="text-center text-sm text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!loading && dados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={colunas.length} className="text-center text-sm text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
              {dados.map((row, i) => (
                <TableRow key={i}>
                  {colunas.map((c) => (
                    <TableCell
                      key={c.cabecalho}
                      className={c.alinhamento === "right" ? "text-right" : c.alinhamento === "center" ? "text-center" : ""}
                    >
                      {c.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {rodape && <div className="mt-3 border-t pt-3 text-sm">{rodape}</div>}
      </CardContent>
    </Card>
  );
}
