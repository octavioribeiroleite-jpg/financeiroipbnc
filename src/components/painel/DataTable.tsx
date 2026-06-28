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

      <div className="space-y-3 md:hidden">
        {carregando ? (
          <div className="rounded-xl border border-border/80 bg-card p-8 text-center shadow-card">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : exibidos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-card">
            {vazioMensagem}
          </div>
        ) : (
          exibidos.map((item, idx) => {
            const temCabecalho = (coluna: Coluna<T>) =>
              typeof coluna.cabecalho !== "string" || coluna.cabecalho.trim().length > 0;
            const acoesColuna = colunas.find((coluna) => !temCabecalho(coluna));
            const dadosColunas = colunas.filter(temCabecalho);
            const primeira = dadosColunas[0];
            const restantes = dadosColunas.slice(1);

            return (
              <article
                key={(item as { id?: string }).id ?? idx}
                className="rounded-xl border border-border/80 bg-card p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {primeira && (
                      <>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {primeira.cabecalho}
                        </p>
                        <div className="mt-1.5 break-words text-base font-semibold text-foreground">
                          {primeira.render(item)}
                        </div>
                      </>
                    )}
                  </div>
                  {acoesColuna && <div className="shrink-0">{acoesColuna.render(item)}</div>}
                </div>

                {restantes.length > 0 && (
                  <div className="mt-4 grid gap-3 border-t border-border/70 pt-4">
                    {restantes.map((coluna) => (
                      <div
                        key={coluna.chave}
                        className="grid grid-cols-[minmax(96px,0.8fr)_minmax(0,1.2fr)] items-start gap-3 text-sm"
                      >
                        <span className="text-muted-foreground">{coluna.cabecalho}</span>
                        <span className="min-w-0 break-words text-right font-medium text-foreground">
                          {coluna.render(item)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-border/80 bg-card shadow-card md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/55">
              <TableRow className="hover:bg-transparent">
                {colunas.map((coluna) => (
                  <TableHead key={coluna.chave} className={coluna.className}>
                    <span className="text-xs font-semibold text-muted-foreground">{coluna.cabecalho}</span>
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
                  <TableRow
                    key={(item as { id?: string }).id ?? idx}
                    className="h-16 transition-colors hover:bg-muted/35"
                  >
                    {colunas.map((coluna) => (
                      <TableCell key={coluna.chave} className={coluna.className}>
                        {coluna.render(item)}
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
