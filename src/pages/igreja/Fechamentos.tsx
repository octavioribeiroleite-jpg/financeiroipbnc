import { useState, useMemo } from "react";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, FileDown, Lock } from "lucide-react";
import {
  useFechamentosIgreja,
  useConsolidarMes,
  useMovimentacoesMes,
  type Fechamento,
} from "@/hooks/fechamentos/useFechamentos";
import { useSociedades } from "@/hooks/cadastros/useSociedades";
import { StatusFechamentoBadge } from "@/components/fechamentos/StatusFechamentoBadge";
import { DetalheFechamento } from "@/components/fechamentos/DetalheFechamento";
import { Badge } from "@/components/ui/badge";
import { formatarMoeda, primeiroDiaMesAtual } from "@/lib/format";
import { useConfigIgreja } from "@/hooks/igreja/useConfigIgreja";
import { gerarPdfFechamento, nomeArquivoFechamento } from "@/lib/pdf/fechamentoPdf";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function FechamentosIgreja() {
  const inicial = primeiroDiaMesAtual().slice(0, 7); // YYYY-MM
  const [ym, setYm] = useState(inicial);
  const [anoStr, mesStr] = ym.split("-");
  const ano = Number(anoStr);
  const mes = Number(mesStr);

  const { data: fechamentos = [], isLoading } = useFechamentosIgreja(ano, mes);
  const { data: sociedades = [] } = useSociedades();
  const consolidar = useConsolidarMes();
  const { config } = useConfigIgreja();
  const { perfil } = useAuth();

  const [detalhe, setDetalhe] = useState<Fechamento | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  const handleBaixarPdf = async (f: Fechamento) => {
    setPdfLoadingId(f.id);
    try {
      const inicio = `${f.ano}-${String(f.mes).padStart(2, "0")}-01`;
      const fim = new Date(f.ano, f.mes, 0);
      const fimIso = `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, "0")}-${String(fim.getDate()).padStart(2, "0")}`;
      const { data, error } = await supabase
        .from("movimentacoes_sociedade")
        .select("id, tipo, origem, valor, data_movimento, observacao")
        .eq("sociedade_id", f.sociedade_id)
        .gte("data_movimento", inicio)
        .lte("data_movimento", fimIso)
        .order("data_movimento", { ascending: true });
      if (error) throw error;
      const nomeSoc = sociedades.find((s) => s.id === f.sociedade_id)?.nome ?? "Sociedade";
      const doc = gerarPdfFechamento({
        fechamento: f,
        nomeSociedade: nomeSoc,
        movimentacoes: data ?? [],
        config,
        geradoPor: perfil?.nome ?? null,
      });
      doc.save(
        nomeArquivoFechamento({
          fechamento: f,
          nomeSociedade: nomeSoc,
          movimentacoes: data ?? [],
          config,
        }),
      );
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? "Erro ao gerar PDF.");
    } finally {
      setPdfLoadingId(null);
    }
  };

  const sociedadesAtivas = useMemo(
    () => sociedades.filter((s) => s.status === "ativa"),
    [sociedades],
  );

  const linhas = useMemo(() => {
    return sociedadesAtivas.map((s) => {
      const f = fechamentos.find((x) => x.sociedade_id === s.id);
      return { sociedade: s, fechamento: f ?? null };
    });
  }, [sociedadesAtivas, fechamentos]);

  const resumo = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    let saldo = 0;
    let pendentes = 0;
    let conferidos = 0;
    let consolidados = 0;
    for (const { fechamento: f } of linhas) {
      if (!f) {
        pendentes++;
        continue;
      }
      entradas += Number(f.total_entradas) || 0;
      saidas += Number(f.total_saidas) || 0;
      saldo += Number(f.saldo_final) || 0;
      if (f.status === "conferido") conferidos++;
      else if (f.status === "consolidado") consolidados++;
      else pendentes++;
    }
    return { entradas, saidas, saldo, pendentes, conferidos, consolidados };
  }, [linhas]);

  const podeConsolidar =
    linhas.length > 0 &&
    linhas.every(({ fechamento: f }) => f && (f.status === "conferido" || f.status === "consolidado")) &&
    resumo.conferidos > 0;

  return (
    <ShellPainel
      titulo="Consolidação mensal"
      descricao="Acompanhe e consolide os fechamentos de todas as sociedades."
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Mês de referência</Label>
          <div className="w-44">
            <Input type="month" value={ym} onChange={(e) => setYm(e.target.value)} />
          </div>
        </div>
        <Button
          onClick={() => consolidar.mutate({ ano, mes })}
          disabled={!podeConsolidar || consolidar.isPending}
        >
          <Lock className="h-4 w-4" />
          Consolidar mês
        </Button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Entradas do mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-emerald-600">{formatarMoeda(resumo.entradas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Saídas do mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-rose-600">{formatarMoeda(resumo.saidas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Saldo consolidado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatarMoeda(resumo.saldo)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs">
              <span className="font-semibold">{resumo.consolidados}</span> consolidados ·{" "}
              <span className="font-semibold">{resumo.conferidos}</span> conferidos ·{" "}
              <span className="font-semibold text-warning">{resumo.pendentes}</span> pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {MESES[mes - 1]} / {ano}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sociedade</TableHead>
                  <TableHead className="text-right">Entradas</TableHead>
                  <TableHead className="text-right">Saídas</TableHead>
                  <TableHead className="text-right">Saldo final</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && linhas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      Nenhuma sociedade ativa.
                    </TableCell>
                  </TableRow>
                )}
                {linhas.map(({ sociedade: s, fechamento: f }) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {f ? formatarMoeda(Number(f.total_entradas)) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-rose-600">
                      {f ? formatarMoeda(Number(f.total_saidas)) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {f ? formatarMoeda(Number(f.saldo_final)) : "—"}
                    </TableCell>
                    <TableCell>
                      {f ? (
                        <StatusFechamentoBadge status={f.status} />
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-warning/30 bg-warning/10 text-warning"
                        >
                          Não enviado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {f && (
                        <div className="inline-flex gap-1">
                          {(f.status === "conferido" || f.status === "consolidado") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBaixarPdf(f)}
                              disabled={pdfLoadingId === f.id}
                              title="Baixar PDF"
                              data-tour="igreja-baixar-pdf"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setDetalhe(f)} title="Detalhes">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DetalheFechamento
        open={!!detalhe}
        onOpenChange={(v) => !v && setDetalhe(null)}
        fechamento={detalhe}
        nomeSociedade={detalhe ? sociedades.find((s) => s.id === detalhe.sociedade_id)?.nome : undefined}
      />
    </ShellPainel>
  );
}
