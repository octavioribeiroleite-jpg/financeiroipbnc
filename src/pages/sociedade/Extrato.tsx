import { useMemo, useState } from "react";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { CardResumo } from "@/components/sociedade/ResumoFinanceiro";
import { MonthPicker } from "@/components/shared/MonthPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownCircle, ArrowUpCircle, Download, Lock, RefreshCw, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useExtratoSociedade, type LinhaExtrato } from "@/hooks/sociedade/useExtratoSociedade";
import { formatarData, formatarMoeda, primeiroDiaMesAtual } from "@/lib/format";
import { exportarCsv } from "@/lib/exportCsv";
import { cn } from "@/lib/utils";

type FiltroTipo = "todas" | "entrada" | "saida" | "ajuste";

const ROTULO_ORIGEM: Record<string, string> = {
  contribuicao: "Contribuição",
  solicitacao_pagamento: "Pagamento",
  ajuste: "Ajuste",
  manual: "Manual",
};

function rotuloOrigem(origem: string) {
  return ROTULO_ORIGEM[origem] ?? origem;
}

export default function ExtratoSociedade() {
  const { sociedadeId } = useAuth();
  const [mes, setMes] = useState<string>(primeiroDiaMesAtual());
  const [tipo, setTipo] = useState<FiltroTipo>("todas");
  const [busca, setBusca] = useState("");

  const { data, isLoading, refetch, isFetching } = useExtratoSociedade(sociedadeId, mes);

  const linhasFiltradas = useMemo<LinhaExtrato[]>(() => {
    const linhas = data?.linhas ?? [];
    const buscaLower = busca.trim().toLowerCase();
    return linhas.filter((l) => {
      if (tipo !== "todas" && l.tipo !== tipo) return false;
      if (buscaLower) {
        const alvo = `${l.observacao ?? ""} ${rotuloOrigem(l.origem)}`.toLowerCase();
        if (!alvo.includes(buscaLower)) return false;
      }
      return true;
    });
  }, [data?.linhas, tipo, busca]);

  function exportar() {
    if (!data) return;
    const ym = mes.slice(0, 7);
    exportarCsv(
      `extrato_${ym}.csv`,
      [
        { cabecalho: "Data", valor: (l: LinhaExtrato) => formatarData(l.data_movimento) },
        { cabecalho: "Origem", valor: (l) => rotuloOrigem(l.origem) },
        { cabecalho: "Descrição", valor: (l) => l.observacao ?? "" },
        {
          cabecalho: "Entrada",
          valor: (l) => (l.tipo === "entrada" ? Number(l.valor).toFixed(2).replace(".", ",") : ""),
        },
        {
          cabecalho: "Saída",
          valor: (l) => (l.tipo === "saida" ? Number(l.valor).toFixed(2).replace(".", ",") : ""),
        },
        {
          cabecalho: "Ajuste",
          valor: (l) => (l.tipo === "ajuste" ? Number(l.valor).toFixed(2).replace(".", ",") : ""),
        },
        { cabecalho: "Saldo", valor: (l) => l.saldoAcumulado.toFixed(2).replace(".", ",") },
      ],
      linhasFiltradas,
    );
  }

  if (!sociedadeId) {
    return (
      <ShellPainel titulo="Extrato" descricao="Conta sem sociedade vinculada.">
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Solicite ao administrador o vínculo da sua conta a uma sociedade.
          </CardContent>
        </Card>
      </ShellPainel>
    );
  }

  return (
    <ShellPainel
      titulo="Extrato da Sociedade"
      descricao="Movimentações do mês com saldo acumulado linha a linha."
    >
      {/* Filtros */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="grid gap-1.5" data-tour="extrato-mes">
            <Label htmlFor="mes">Mês</Label>
            <MonthPicker id="mes" value={mes} onChange={setMes} />
          </div>
          <div className="grid gap-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as FiltroTipo)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
                <SelectItem value="ajuste">Ajustes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid flex-1 gap-1.5 min-w-[200px]">
            <Label htmlFor="busca">Buscar na descrição</Label>
            <Input
              id="busca"
              placeholder="ex.: João, aluguel, oferta…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              Atualizar
            </Button>
            <Button variant="outline" onClick={exportar} disabled={!data || linhasFiltradas.length === 0}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CardResumo
          titulo="Saldo inicial"
          valor={isLoading ? "…" : formatarMoeda(data?.saldoInicial ?? 0)}
          descricao="Posição no início do mês"
          icone={<Wallet className="h-5 w-5" />}
        />
        <CardResumo
          titulo="Entradas no mês"
          valor={isLoading ? "…" : formatarMoeda(data?.totalEntradas ?? 0)}
          icone={<ArrowUpCircle className="h-5 w-5" />}
          cor="success"
        />
        <CardResumo
          titulo="Saídas no mês"
          valor={isLoading ? "…" : formatarMoeda(data?.totalSaidas ?? 0)}
          icone={<ArrowDownCircle className="h-5 w-5" />}
          cor="destructive"
        />
        <CardResumo
          titulo="Saldo final"
          valor={isLoading ? "…" : formatarMoeda(data?.saldoFinal ?? 0)}
          descricao={data?.consolidado ? "Mês consolidado" : "Posição no fim do mês"}
          icone={<Wallet className="h-5 w-5" />}
          cor={(data?.saldoFinal ?? 0) >= 0 ? "success" : "destructive"}
        />
      </div>

      {/* Tabela */}
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Movimentações</CardTitle>
          {data?.consolidado && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              Mês consolidado
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px]">Data</TableHead>
                <TableHead className="w-[130px]">Origem</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right w-[120px]">Entrada</TableHead>
                <TableHead className="text-right w-[120px]">Saída</TableHead>
                <TableHead className="text-right w-[140px]">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    Carregando…
                  </TableCell>
                </TableRow>
              ) : linhasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    Sem movimentações neste mês.
                  </TableCell>
                </TableRow>
              ) : (
                linhasFiltradas.map((l) => {
                  const valor = Number(l.valor) || 0;
                  return (
                    <TableRow key={l.id} className={cn(!l.confirmada && "opacity-60")}>
                      <TableCell className="font-medium">{formatarData(l.data_movimento)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {rotuloOrigem(l.origem)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[420px] truncate">{l.observacao ?? "—"}</TableCell>
                      <TableCell className="text-right text-success">
                        {l.tipo === "entrada" ? formatarMoeda(valor) : ""}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {l.tipo === "saida" ? formatarMoeda(valor) : ""}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium tabular-nums",
                          l.saldoAcumulado < 0 && "text-destructive",
                        )}
                      >
                        {formatarMoeda(l.saldoAcumulado)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ShellPainel>
  );
}
