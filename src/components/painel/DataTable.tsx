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
  cabecalho: ReactNode;
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
          <Input
            value={termo}
            onChange={(e) => {
              setTermo(e.target.value);
              setPagina(1);
            }}
            placeholder={buscaPlaceholder}
            className="h-11 rounded-xl bg-card pl-10 shadow-sm"
          />
        </div>
        {acoes && (
          <div data-tour="acoes-pagina" className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">
            {acoes}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/55">
              <TableRow className="hover:bg-transparent">
                {colunas.map((c) => (
                  <TableHead key={c.chave} className={c.className}>
                    <span className="text-xs font-semibold text-muted-foreground">{c.cabecalho}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando ? (
                <TableRow>
                  <TableCell colSpan={colunas.length} className="h-28 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : exibidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colunas.length} className="h-32 text-center text-sm text-muted-foreground">
                    {vazioMensagem}
                  </TableCell>
                </TableRow>
              ) : (
                exibidos.map((item, idx) => (
                  <TableRow key={(item as { id?: string }).id ?? idx} className="h-16 transition-colors hover:bg-muted/35">
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
      </div>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          {filtrados.length} registro{filtrados.length === 1 ? "" : "s"}
          {totalPaginas > 1 ? ` · Página ${paginaAtual} de ${totalPaginas}` : ""}
        </span>

        {totalPaginas > 1 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={paginaAtual === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
