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
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{titulo}</CardTitle>
        <div className="flex items-center gap-2">
          {acoes}
          <Button size="sm" variant="outline" onClick={handleExport} disabled={dados.length === 0}>
            <Download className="mr-1 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
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
