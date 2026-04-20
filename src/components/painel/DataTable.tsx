import { ReactNode, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search } from "lucide-react";

export interface Coluna<T> {
  chave: string;
  cabecalho: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  dados: T[];
  colunas: Coluna<T>[];
  carregando?: boolean;
  buscaPlaceholder?: string;
  filtrarPor?: (item: T, termo: string) => boolean;
  acoes?: ReactNode;
  vazioMensagem?: string;
  paginacao?: number;
}

export function DataTable<T>({
  dados,
  colunas,
  carregando,
  buscaPlaceholder = "Buscar...",
  filtrarPor,
  acoes,
  vazioMensagem = "Nenhum registro encontrado.",
  paginacao = 50,
}: DataTableProps<T>) {
  const [termo, setTermo] = useState("");
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    if (!termo.trim() || !filtrarPor) return dados;
    return dados.filter((item) => filtrarPor(item, termo.trim().toLowerCase()));
  }, [dados, termo, filtrarPor]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / paginacao));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * paginacao;
  const exibidos = filtrados.slice(inicio, inicio + paginacao);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={termo}
            onChange={(e) => {
              setTermo(e.target.value);
              setPagina(1);
            }}
            placeholder={buscaPlaceholder}
            className="pl-8"
          />
        </div>
        {acoes && <div data-tour="acoes-pagina" className="flex flex-wrap gap-2">{acoes}</div>}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {colunas.map((c) => (
                <TableHead key={c.chave} className={c.className}>
                  {c.cabecalho}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {carregando ? (
              <TableRow>
                <TableCell colSpan={colunas.length} className="h-24 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : exibidos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colunas.length} className="h-24 text-center text-sm text-muted-foreground">
                  {vazioMensagem}
                </TableCell>
              </TableRow>
            ) : (
              exibidos.map((item, idx) => (
                <TableRow key={(item as { id?: string }).id ?? idx}>
                  {colunas.map((c) => (
                    <TableCell key={c.chave} className={c.className}>
                      {c.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {paginaAtual} de {totalPaginas} · {filtrados.length} registros
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={paginaAtual === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
