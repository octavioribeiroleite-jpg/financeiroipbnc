import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useFechamentoGeral } from "@/hooks/fechamentos/useFechamentoGeral";
import type { Fechamento } from "@/hooks/fechamentos/useFechamentos";
import { useConfigIgreja } from "@/hooks/igreja/useConfigIgreja";
import { useAuth } from "@/contexts/AuthContext";
import { formatarData, formatarMoeda, primeiroDiaMesAtual } from "@/lib/format";
import { gerarPdfFechamento, nomeArquivoFechamento } from "@/lib/pdf/fechamentoPdf";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function criarFechamentoSintetico(
  dados: ReturnType<typeof useFechamentoGeral>["data"],
  escopo: { id: string; saldoInicial: number; entradas: number; saidas: number; ajustes: number; saldoFinal: number; observacao: string },
): Fechamento | null {
  if (!dados) return null;
  return {
    id: `${escopo.id}-${dados.ano}-${String(dados.mes).padStart(2, "0")}`,
    sociedade_id: escopo.id,
    ano: dados.ano,
    mes: dados.mes,
    saldo_inicial: escopo.saldoInicial,
    total_entradas: escopo.entradas + escopo.ajustes,
    total_saidas: escopo.saidas,
    saldo_final: escopo.saldoFinal,
    status: "aberto",
    observacao: escopo.observacao,
    data_criacao: new Date().toISOString(),
    data_envio: null,
    enviado_por: null,
    data_conferencia: null,
    conferido_por: null,
  };
}

export default function FechamentosSociedade() {
  const [mesReferencia, setMesReferencia] = useState(() => primeiroDiaMesAtual().slice(0, 7));
  const [escopoRelatorio, setEscopoRelatorio] = useState<string>("geral");
  const { data, isLoading } = useFechamentoGeral(mesReferencia);
  const { config } = useConfigIgreja();
  const { perfil } = useAuth();

  const baixarPdf = () => {
    if (!data) return;
    const ehGeral = escopoRelatorio === "geral";

    const escopo = ehGeral
      ? {
          id: "geral",
          saldoInicial: data.resumo.saldoInicial,
          entradas: data.resumo.entradas,
          saidas: data.resumo.saidas,
          ajustes: data.resumo.ajustes,
          saldoFinal: data.resumo.saldoFinal,
          observacao: "Fechamento consolidado com todas as sociedades.",
        }
      : (() => {
          const s = data.sociedades.find((x) => x.sociedadeId === escopoRelatorio);
          if (!s) return null;
          return {
            id: s.sociedadeId,
            saldoInicial: s.saldoInicial,
            entradas: s.entradas,
            saidas: s.saidas,
            ajustes: s.ajustes,
            saldoFinal: s.saldoFinal,
            observacao: `Fechamento individual da sociedade ${s.nome}.`,
          };
        })();

    if (!escopo) return;

    const sociedadeAtual = ehGeral ? null : data.sociedades.find((x) => x.sociedadeId === escopoRelatorio);
    const nomeSociedade = ehGeral ? "Geral da conta" : sociedadeAtual?.nome ?? "Sociedade";

    const fechamento = criarFechamentoSintetico(data, escopo);
    if (!fechamento) return;

    const movimentacoesFiltradas = ehGeral
      ? data.movimentacoes
      : data.movimentacoes.filter((m) => m.sociedade_id === escopoRelatorio);

    const doc = gerarPdfFechamento({
      fechamento,
      nomeSociedade,
      movimentacoes: movimentacoesFiltradas.map((m) => ({
        id: m.id,
        tipo: m.tipo,
        origem: m.origem,
        valor: m.valor,
        data_movimento: m.data_movimento,
        observacao: m.observacao,
        confirmada: m.confirmada,
        sociedade_nome: m.sociedade_nome,
      })),
      config,
      geradoPor: perfil?.nome,
      saldosPorSociedade: ehGeral
        ? data.sociedades.map((s) => ({ nome: s.nome, saldoFinal: s.saldoFinal }))
        : undefined,
    });

    doc.save(nomeArquivoFechamento({ fechamento, nomeSociedade, movimentacoes: [], config }));
  };

  return (
    <ShellPainel
      titulo="Fechamento mensal"
      descricao="Consolidado de todas as sociedades, com entradas, saídas e saldo separado por cofrinho."
    >
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Fechamento mensal geral</h2>
          <p className="text-sm text-muted-foreground">
            Tudo junto na conta principal, com o valor separado por sociedade.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="mes-fechamento">Mês do fechamento</Label>
            <Input
              id="mes-fechamento"
              type="month"
              value={mesReferencia}
              onChange={(event) => setMesReferencia(event.target.value)}
              className="w-full sm:w-48"
            />
          </div>
          <Button onClick={baixarPdf} disabled={!data || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Relatório PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Saldo inicial {data ? `em ${formatarData(data.inicio)}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatarMoeda(data?.resumo.saldoInicial)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data ? `Acumulado até ${formatarData(data.fimAnterior)}.` : "Saldo anterior ao mês selecionado."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Entradas confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600">{formatarMoeda(data?.resumo.entradas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Saídas confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-rose-600">{formatarMoeda(data?.resumo.saidas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Saldo final consolidado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatarMoeda(data?.resumo.saldoFinal)}</p>
            {!!data?.resumo.pendentes && (
              <p className="mt-1 text-xs text-amber-700">
                {data.resumo.pendentes} lançamento(s) pendente(s) fora do saldo.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-base">Cofrinhos por sociedade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sociedade</TableHead>
                  <TableHead className="text-right">
                    Saldo inicial
                    {data && <span className="block text-xs font-normal text-muted-foreground">até {formatarData(data.fimAnterior)}</span>}
                  </TableHead>
                  <TableHead className="text-right">Entradas</TableHead>
                  <TableHead className="text-right">Saídas</TableHead>
                  <TableHead className="text-right">Saldo final</TableHead>
                  <TableHead className="text-right">Participação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      Carregando fechamento...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && data?.sociedades.map((sociedade) => (
                  <TableRow key={sociedade.sociedadeId}>
                    <TableCell className="font-medium">
                      {sociedade.nome}
                      <span className="ml-2 text-xs text-muted-foreground">{sociedade.tipo}</span>
                    </TableCell>
                    <TableCell className="text-right">{formatarMoeda(sociedade.saldoInicial)}</TableCell>
                    <TableCell className="text-right text-emerald-600">{formatarMoeda(sociedade.entradas)}</TableCell>
                    <TableCell className="text-right text-rose-600">{formatarMoeda(sociedade.saidas)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatarMoeda(sociedade.saldoFinal)}</TableCell>
                    <TableCell className="text-right">{sociedade.participacao.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-base">
            Movimentações de {data ? `${MESES[data.mes - 1]} / ${data.ano}` : "mês"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Sociedade</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      Buscando movimentações...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && data?.movimentacoes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      Nenhuma movimentação nesse mês.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && data?.movimentacoes.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell>{formatarData(mov.data_movimento)}</TableCell>
                    <TableCell className="font-medium">{mov.sociedade_nome}</TableCell>
                    <TableCell>{mov.tipo === "saida" ? "Saída" : mov.tipo === "ajuste" ? "Ajuste" : "Entrada"}</TableCell>
                    <TableCell className="max-w-md truncate">{mov.observacao || mov.origem}</TableCell>
                    <TableCell>
                      <Badge variant={mov.confirmada ? "secondary" : "outline"}>
                        {mov.confirmada ? "Contabilizada" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${mov.tipo === "saida" ? "text-rose-600" : "text-emerald-600"}`}>
                      {formatarMoeda(mov.valor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </ShellPainel>
  );
}
