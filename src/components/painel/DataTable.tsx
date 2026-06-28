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
        {acoes && <div data-tour="acoes-pagina" className="flex w-full flex-wrap gap-2 sm:w-auto">{acoes}</div>}
      </div>

      <div className="space-y-3 md:hidden">
        {carregando ? (
          <div className="rounded-md border bg-card p-6 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : exibidos.length === 0 ? (
          <div className="rounded-md border bg-card p-6 text-center text-sm text-muted-foreground">
            {vazioMensagem}
          </div>
        ) : (
          exibidos.map((item, idx) => {
            const temCabecalho = (c: Coluna<T>) => typeof c.cabecalho !== "string" || c.cabecalho.trim().length > 0;
            const acoesColuna = colunas.find((c) => !temCabecalho(c));
            const dadosColunas = colunas.filter(temCabecalho);
            const primeira = dadosColunas[0];
            const restantes = dadosColunas.slice(1);

            return (
              <div key={(item as { id?: string }).id ?? idx} className="rounded-md border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {primeira && (
                      <>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {primeira.cabecalho}
                        </p>
                        <div className="mt-1 break-words text-base font-semibold text-foreground">
                          {primeira.render(item)}
                        </div>
                      </>
                    )}
                  </div>
                  {acoesColuna && <div className="shrink-0">{acoesColuna.render(item)}</div>}
                </div>

                {restantes.length > 0 && (
                  <div className="mt-3 grid gap-3 border-t pt-3">
                    {restantes.map((c) => (
                      <div key={c.chave} className="grid grid-cols-[minmax(92px,0.8fr)_minmax(0,1.2fr)] gap-3 text-sm">
                        <span className="text-muted-foreground">{c.cabecalho}</span>
                        <span className="min-w-0 break-words text-right font-medium text-foreground">
                          {c.render(item)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="hidden rounded-md border bg-card md:block">
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
