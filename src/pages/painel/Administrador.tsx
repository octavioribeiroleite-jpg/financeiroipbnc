import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowRight,
  BarChart3,
  BookCheck,
  Briefcase,
  Building2,
  FileText,
  HandCoins,
  Receipt,
  Tags,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useSociedades } from "@/hooks/cadastros/useSociedades";
import { useCategorias } from "@/hooks/cadastros/useCategorias";
import { useFornecedores } from "@/hooks/cadastros/useFornecedores";
import { useSaldoPorSociedade } from "@/hooks/igreja/useSaldoPorSociedade";
import { TabelaSaldoSociedades } from "@/components/igreja/TabelaSaldoSociedades";
import { useContribuicoesSociedade } from "@/hooks/sociedade/useContribuicoesSociedade";
import { useSolicitacoesSociedade } from "@/hooks/sociedade/useSolicitacoesSociedade";
import { useFechamentosSociedade } from "@/hooks/fechamentos/useFechamentos";
import { useSociedadeOperacional } from "@/contexts/SociedadeOperacionalContext";
import { formatarMoeda, primeiroDiaMesAtual } from "@/lib/format";

interface AtalhoProps {
  titulo: string;
  descricao: string;
  icone: typeof Building2;
  para: string;
  valor?: string;
  carregando?: boolean;
  legenda?: string;
}

function Atalho({ titulo, descricao, icone: Icone, para, valor, carregando, legenda }: AtalhoProps) {
  return (
    <Link to={para} className="group block">
      <Card className="h-full transition-shadow hover:shadow-[var(--shadow-elegant)]">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icone className="h-5 w-5" />
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </CardHeader>
        <CardContent>
          <CardTitle className="text-base">{titulo}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{descricao}</p>
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {carregando ? "—" : (valor ?? "0")}
          </p>
          {legenda && <p className="text-xs text-muted-foreground">{legenda}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

interface IndicadorProps {
  titulo: string;
  valor: string;
  descricao: string;
  icone: typeof Wallet;
  tom?: "default" | "success" | "danger" | "warning";
}

function Indicador({ titulo, valor, descricao, icone: Icone, tom = "default" }: IndicadorProps) {
  const corIcone = {
    default: "text-primary",
    success: "text-emerald-600",
    danger: "text-rose-600",
    warning: "text-amber-600",
  }[tom];

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{valor}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
            <Icone className={`h-4 w-4 ${corIcone}`} />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{descricao}</p>
      </CardContent>
    </Card>
  );
}

export default function PainelAdministrador() {
  const [periodo, setPeriodo] = useState(primeiroDiaMesAtual());
  const sociedades = useSociedades();
  const categorias = useCategorias();
  const fornecedores = useFornecedores();
  const { sociedadeSelecionadaId, sociedadeSelecionada } = useSociedadeOperacional();

  const { data: saldos = [] } = useSaldoPorSociedade(periodo);
  const { data: contribuicoes = [] } = useContribuicoesSociedade(sociedadeSelecionadaId);
  const { data: solicitacoes = [] } = useSolicitacoesSociedade(sociedadeSelecionadaId);
  const { data: fechamentos = [] } = useFechamentosSociedade(sociedadeSelecionadaId);

  const periodoDate = new Date(periodo + "T00:00:00");
  const anoRef = periodoDate.getFullYear();
  const mesRef = periodoDate.getMonth() + 1;

  const saldoSociedadeAtiva = useMemo(
    () => saldos.find((x) => x.sociedadeId === sociedadeSelecionadaId) ?? null,
    [saldos, sociedadeSelecionadaId],
  );

  const totaisConsolidados = useMemo(
    () => ({
      saldo: saldos.reduce((acc, s) => acc + s.saldoAtual, 0),
      entradas: saldos.reduce((acc, s) => acc + s.entradasMes, 0),
      saidas: saldos.reduce((acc, s) => acc + s.saidasMes, 0),
      resultado: saldos.reduce((acc, s) => acc + s.entradasMes - s.saidasMes, 0),
    }),
    [saldos],
  );

  const contribuicoesMes = useMemo(
    () =>
      contribuicoes.filter((c) => {
        const d = new Date(c.data_pagamento + "T00:00:00");
        return d.getFullYear() === anoRef && d.getMonth() + 1 === mesRef;
      }),
    [contribuicoes, anoRef, mesRef],
  );

  const totalContribMes = contribuicoesMes.reduce((acc, c) => acc + Number(c.valor || 0), 0);

  const pagamentosAbertos = useMemo(
    () => solicitacoes.filter((s) => ["enviada", "em_analise", "aprovada"].includes(s.status)),
    [solicitacoes],
  );

  const fechamentoMes = useMemo(
    () => fechamentos.find((f) => f.ano === anoRef && f.mes === mesRef),
    [fechamentos, anoRef, mesRef],
  );

  const statusFechamentoLabel = fechamentoMes
    ? fechamentoMes.status === "consolidado"
      ? "Consolidado"
      : fechamentoMes.status === "conferido"
        ? "Conferido"
        : fechamentoMes.status === "enviado"
          ? "Enviado"
          : "Em aberto"
    : "Sem fechamento";

  return (
    <ShellPainel
      titulo="Painel geral"
      descricao="Visão única da operação financeira por sociedade."
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-foreground">Caixa geral e cofrinhos</h2>
            <Badge variant="secondary" className="text-xs">
              {sociedadeSelecionada ? `detalhe: ${sociedadeSelecionada.nome}` : "geral da conta"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Acompanhe o saldo total da igreja e quanto pertence a cada sociedade.
          </p>
        </div>
        <div className="w-full sm:w-[220px]">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={primeiroDiaMesAtual()}>Mês atual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          titulo="Saldo consolidado"
          icone={Wallet}
          valor={formatarMoeda(totaisConsolidados.saldo)}
          descricao={`Soma atual de ${saldos.length} cofrinho(s).`}
        />
        <Indicador
          titulo="Entradas do mês"
          icone={TrendingUp}
          valor={formatarMoeda(totaisConsolidados.entradas)}
          descricao="Arrecadações confirmadas no período."
          tom="success"
        />
        <Indicador
          titulo="Saídas do mês"
          icone={TrendingDown}
          valor={formatarMoeda(totaisConsolidados.saidas)}
          descricao="Pagamentos confirmados no período."
          tom="danger"
        />
        <Indicador
          titulo="Resultado do mês"
          icone={BarChart3}
          valor={formatarMoeda(totaisConsolidados.resultado)}
          descricao="Entradas menos saídas confirmadas."
          tom={totaisConsolidados.resultado >= 0 ? "success" : "danger"}
        />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {sociedadeSelecionada ? "Detalhe da sociedade" : "Geral da conta"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {sociedadeSelecionada
                ? "Detalhes do cofrinho selecionado no topo."
                : "Resumo consolidado de todos os cofrinhos da igreja."}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  {sociedadeSelecionada ? "Sociedade" : "Visão"}
                </p>
                <p className="mt-1 truncate text-lg font-semibold">
                  {sociedadeSelecionada?.nome ?? "Geral da conta"}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Saldo atual</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatarMoeda(saldoSociedadeAtiva?.saldoAtual ?? totaisConsolidados.saldo)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Entradas do mês</p>
                <p className="mt-1 text-lg font-semibold text-emerald-600">
                  {formatarMoeda(saldoSociedadeAtiva?.entradasMes ?? totaisConsolidados.entradas)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Saídas do mês</p>
                <p className="mt-1 text-lg font-semibold text-rose-600">
                  {formatarMoeda(saldoSociedadeAtiva?.saidasMes ?? totaisConsolidados.saidas)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {sociedadeSelecionada ? (
                <>
                  <Button asChild>
                    <Link to="/sociedade/contribuicoes">
                      <HandCoins className="h-4 w-4" />
                      Lançar entrada
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/central/solicitacoes">
                      <FileText className="h-4 w-4" />
                      Registrar saída
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/sociedade/extrato">
                      <Receipt className="h-4 w-4" />
                      Ver extrato
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild>
                    <Link to="/igreja/relatorios">
                      <BarChart3 className="h-4 w-4" />
                      Ver relatório geral
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/sociedade/contribuicoes">
                      <HandCoins className="h-4 w-4" />
                      Lançar por sociedade
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fechamento mensal</CardTitle>
            <p className="text-sm text-muted-foreground">
              Atalhos para conferir e prestar contas do mês selecionado.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Pagamentos abertos</p>
                <p className="mt-1 text-lg font-semibold">{pagamentosAbertos.length}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Status do mês</p>
                <p className="mt-1 truncate text-lg font-semibold">{statusFechamentoLabel}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to="/igreja/relatorios">
                  <BarChart3 className="h-4 w-4" />
                  Relatório
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/sociedade/fechamentos">
                  <BookCheck className="h-4 w-4" />
                  Fechar mês
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4">
        <TabelaSaldoSociedades
          dados={saldos}
          sociedadeSelecionadaId={sociedadeSelecionadaId}
        />
      </div>

      <div className="mb-3">
        <h3 className="text-base font-semibold text-foreground">Cadastros de apoio</h3>
        <p className="text-sm text-muted-foreground">
          Dados usados para organizar lançamentos, categorias e fornecedores.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Atalho
          titulo="Sociedades"
          descricao="Cadastros e filtros operacionais."
          icone={Building2}
          para="/cadastros/sociedades"
          carregando={sociedades.isLoading}
          valor={String((sociedades.data ?? []).filter((s) => s.status === "ativa").length)}
          legenda="ativas"
        />
        <Atalho
          titulo="Categorias"
          descricao="Entradas e saídas financeiras."
          icone={Tags}
          para="/cadastros/categorias"
          carregando={categorias.isLoading}
          valor={String((categorias.data ?? []).filter((c) => c.ativo).length)}
          legenda="ativas"
        />
        <Atalho
          titulo="Fornecedores"
          descricao="Prestadores e fornecedores."
          icone={Briefcase}
          para="/cadastros/fornecedores"
          carregando={fornecedores.isLoading}
          valor={String((fornecedores.data ?? []).filter((f) => f.ativo).length)}
          legenda="ativos"
        />
      </div>
    </ShellPainel>
  );
}
