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
  destaque?: boolean;
}

function Indicador({ titulo, valor, descricao, icone: Icone, tom = "default", destaque = false }: IndicadorProps) {
  const corIcone = {
    default: "text-primary",
    success: "text-emerald-600",
    danger: "text-rose-600",
    warning: "text-amber-600",
  }[tom];

  return (
    <Card className={destaque ? "sm:col-span-2 xl:col-span-1" : ""}>
      <CardContent className="flex min-h-[126px] h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</p>
            <p className="mt-2 truncate text-2xl font-semibold text-foreground">{valor}</p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
            <Icone className={`h-4 w-4 ${corIcone}`} />
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{descricao}</p>
      </CardContent>
    </Card>
  );
}

function criarPeriodos() {
  const hoje = new Date();

  return Array.from({ length: 12 }, (_, indice) => {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - indice, 1);
    const valor = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-01`;
    const texto = data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return {
      valor,
      rotulo: texto.charAt(0).toUpperCase() + texto.slice(1),
    };
  });
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

  const periodos = useMemo(criarPeriodos, []);
  const periodoSelecionado = periodos.find((item) => item.valor === periodo)?.rotulo ?? "Período selecionado";
  const periodoDate = new Date(periodo + "T00:00:00");
  const anoRef = periodoDate.getFullYear();
  const mesRef = periodoDate.getMonth() + 1;

  const saldoSociedadeAtiva = useMemo(
    () => saldos.find((item) => item.sociedadeId === sociedadeSelecionadaId) ?? null,
    [saldos, sociedadeSelecionadaId],
  );

  const totaisConsolidados = useMemo(
    () => ({
      saldo: saldos.reduce((acc, item) => acc + item.saldoAtual, 0),
      entradas: saldos.reduce((acc, item) => acc + item.entradasMes, 0),
      saidas: saldos.reduce((acc, item) => acc + item.saidasMes, 0),
      resultado: saldos.reduce((acc, item) => acc + item.entradasMes - item.saidasMes, 0),
    }),
    [saldos],
  );

  const resumoAtual = saldoSociedadeAtiva
    ? {
        saldo: saldoSociedadeAtiva.saldoAtual,
        entradas: saldoSociedadeAtiva.entradasMes,
        saidas: saldoSociedadeAtiva.saidasMes,
        resultado: saldoSociedadeAtiva.entradasMes - saldoSociedadeAtiva.saidasMes,
      }
    : totaisConsolidados;

  const escopoLabel = sociedadeSelecionada?.nome ?? "Todas as sociedades";
  const quantidadeSociedades = sociedadeSelecionada ? 1 : saldos.length;

  const contribuicoesMes = useMemo(
    () =>
      contribuicoes.filter((contribuicao) => {
        const data = new Date(contribuicao.data_pagamento + "T00:00:00");
        return data.getFullYear() === anoRef && data.getMonth() + 1 === mesRef;
      }),
    [contribuicoes, anoRef, mesRef],
  );

  const totalContribMes = contribuicoesMes.reduce(
    (acc, contribuicao) => acc + Number(contribuicao.valor || 0),
    0,
  );

  const pagamentosAbertos = useMemo(
    () => solicitacoes.filter((solicitacao) => ["enviada", "em_analise", "aprovada"].includes(solicitacao.status)),
    [solicitacoes],
  );

  const fechamentoMes = useMemo(
    () => fechamentos.find((fechamento) => fechamento.ano === anoRef && fechamento.mes === mesRef),
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
      descricao="Resumo financeiro do escopo e período selecionados."
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
            Escopo: {escopoLabel}
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
            {quantidadeSociedades} {quantidadeSociedades === 1 ? "sociedade" : "sociedades"}
          </Badge>
        </div>

        <div className="w-full sm:w-[230px]">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="h-11 rounded-xl bg-card shadow-sm">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((item) => (
                <SelectItem key={item.valor} value={item.valor}>
                  {item.rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-3 rounded-xl border border-border/80 bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
        <strong className="font-semibold text-foreground">Como ler os valores:</strong>{" "}
        o saldo é o total atual do escopo. Entradas, saídas e resultado consideram somente lançamentos confirmados de {periodoSelecionado}.
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Indicador
          destaque
          titulo={sociedadeSelecionada ? "Saldo atual da sociedade" : "Saldo total atual"}
          icone={Wallet}
          valor={formatarMoeda(resumoAtual.saldo)}
          descricao={
            sociedadeSelecionada
              ? `Saldo acumulado atual de ${sociedadeSelecionada.nome}. Não se limita ao mês.`
              : `Saldo acumulado atual somado de ${saldos.length} sociedade(s). Não se limita ao mês.`
          }
        />
        <Indicador
          titulo={`Entradas de ${periodoSelecionado}`}
          icone={TrendingUp}
          valor={formatarMoeda(resumoAtual.entradas)}
          descricao={`Entradas confirmadas em ${escopoLabel}.`}
          tom="success"
        />
        <Indicador
          titulo={`Saídas de ${periodoSelecionado}`}
          icone={TrendingDown}
          valor={formatarMoeda(resumoAtual.saidas)}
          descricao={`Pagamentos confirmados em ${escopoLabel}.`}
          tom="danger"
        />
        <Indicador
          destaque
          titulo={`Resultado de ${periodoSelecionado}`}
          icone={BarChart3}
          valor={formatarMoeda(resumoAtual.resultado)}
          descricao="Entradas confirmadas menos saídas confirmadas no período."
          tom={resumoAtual.resultado >= 0 ? "success" : "danger"}
        />
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ações financeiras</CardTitle>
            <p className="text-sm text-muted-foreground">
              {sociedadeSelecionada
                ? `Ações aplicadas a ${sociedadeSelecionada.nome}.`
                : "Escolha uma sociedade no seletor superior para lançar entradas ou pagamentos."}
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Contribuições lançadas no mês</p>
                <p className="mt-1 text-lg font-semibold">{formatarMoeda(totalContribMes)}</p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Pagamentos em processamento</p>
                <p className="mt-1 text-lg font-semibold">{pagamentosAbertos.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button asChild disabled={!sociedadeSelecionada}>
                <Link to="/sociedade/contribuicoes">
                  <HandCoins className="h-4 w-4" />
                  Nova entrada
                </Link>
              </Button>
              <Button asChild variant="outline" disabled={!sociedadeSelecionada}>
                <Link to="/sociedade/solicitacoes">
                  <FileText className="h-4 w-4" />
                  Pagamento
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/sociedade/extrato">
                  <Receipt className="h-4 w-4" />
                  Extrato
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/igreja/relatorios">
                  <BarChart3 className="h-4 w-4" />
                  Relatório
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fechamento mensal</CardTitle>
            <p className="text-sm text-muted-foreground">Situação do período e escopo selecionados.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Pagamentos abertos</p>
                <p className="mt-1 text-lg font-semibold">{pagamentosAbertos.length}</p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
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
        <TabelaSaldoSociedades dados={saldos} sociedadeSelecionadaId={sociedadeSelecionadaId} />
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
          valor={String((sociedades.data ?? []).filter((sociedade) => sociedade.status === "ativa").length)}
          legenda="ativas"
        />
        <Atalho
          titulo="Categorias"
          descricao="Entradas e saídas financeiras."
          icone={Tags}
          para="/cadastros/categorias"
          carregando={categorias.isLoading}
          valor={String((categorias.data ?? []).filter((categoria) => categoria.ativo).length)}
          legenda="ativas"
        />
        <Atalho
          titulo="Fornecedores"
          descricao="Prestadores e fornecedores."
          icone={Briefcase}
          para="/cadastros/fornecedores"
          carregando={fornecedores.isLoading}
          valor={String((fornecedores.data ?? []).filter((fornecedor) => fornecedor.ativo).length)}
          legenda="ativos"
        />
      </div>
    </ShellPainel>
  );
}
