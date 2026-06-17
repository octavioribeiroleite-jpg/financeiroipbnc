import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Tags, Briefcase, ArrowRight, HandCoins, FileText, BookCheck, Wallet } from "lucide-react";
import { useSociedades } from "@/hooks/cadastros/useSociedades";
import { useCategorias } from "@/hooks/cadastros/useCategorias";
import { useFornecedores } from "@/hooks/cadastros/useFornecedores";
import { useSaldoPorSociedade } from "@/hooks/igreja/useSaldoPorSociedade";
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

  const saldoAtivo = useMemo(() => {
    const s = saldos.find((x) => x.sociedadeId === sociedadeSelecionadaId);
    return s?.saldoAtual ?? 0;
  }, [saldos, sociedadeSelecionadaId]);

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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-foreground">Operação consolidada</h2>
            {sociedadeSelecionada && (
              <Badge variant="secondary" className="text-xs">
                {sociedadeSelecionada.nome}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Indicadores filtrados pela sociedade ativa no seletor do topo.
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

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Atalho
          titulo="Saldo da sociedade"
          descricao="Posição atual considerando movimentações confirmadas."
          icone={Wallet}
          para="/sociedade/extrato"
          valor={formatarMoeda(saldoAtivo)}
          legenda={sociedadeSelecionada?.nome ?? "—"}
        />
        <Atalho
          titulo="Contribuições do mês"
          descricao="Total já lançado no período selecionado."
          icone={HandCoins}
          para="/sociedade/contribuicoes"
          valor={formatarMoeda(totalContribMes)}
          legenda={`${contribuicoesMes.length} lançamento(s)`}
        />
        <Atalho
          titulo="Pagamentos em aberto"
          descricao="Aguardando análise, aprovação ou quitação."
          icone={FileText}
          para="/central/solicitacoes"
          valor={String(pagamentosAbertos.length)}
          legenda="solicitações"
        />
        <Atalho
          titulo="Fechamento do mês"
          descricao="Situação do fechamento da sociedade ativa."
          icone={BookCheck}
          para="/sociedade/fechamentos"
          valor={statusFechamentoLabel}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/sociedade/contribuicoes">Lançar contribuição</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/central/solicitacoes">Registrar pagamento</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/sociedade/fechamentos">Fechar mês</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
