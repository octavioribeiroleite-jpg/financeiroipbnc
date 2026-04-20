import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Tags, Briefcase, ArrowRight, HandCoins, FileText, BookCheck, BarChart3 } from "lucide-react";
import { useSociedades } from "@/hooks/cadastros/useSociedades";
import { useCategorias } from "@/hooks/cadastros/useCategorias";
import { useFornecedores } from "@/hooks/cadastros/useFornecedores";
import { useResumoIgreja } from "@/hooks/igreja/useResumoIgreja";
import { useSaldoPorSociedade } from "@/hooks/igreja/useSaldoPorSociedade";
import { useContribuicoesCentral } from "@/hooks/central/useContribuicoesCentral";
import { useSolicitacoesCentral } from "@/hooks/central/useSolicitacoesCentral";
import { primeiroDiaMesAtual } from "@/lib/format";

interface AtalhoProps {
  titulo: string;
  descricao: string;
  icone: typeof Building2;
  para: string;
  contagem?: number;
  carregando?: boolean;
}

function Atalho({ titulo, descricao, icone: Icone, para, contagem, carregando }: AtalhoProps) {
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
            {carregando ? "—" : (contagem ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">ativos</p>
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
  const { data: resumo } = useResumoIgreja(periodo);
  const { data: saldos = [] } = useSaldoPorSociedade(periodo);
  const { data: contribuicoes = [] } = useContribuicoesCentral();
  const { data: solicitacoes = [] } = useSolicitacoesCentral();

  const fechamentoPendente = useMemo(
    () => saldos.filter((s) => s.entradasMes > 0 || s.saidasMes > 0).length,
    [saldos],
  );

  const pendentesPagamento = useMemo(
    () => solicitacoes.filter((s) => ["enviada", "em_analise", "aprovada"].includes(s.status)).length,
    [solicitacoes],
  );

  return (
    <ShellPainel
      titulo="Painel geral"
      descricao="Visão única da operação financeira por sociedade."
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Operação consolidada</h2>
          <p className="text-sm text-muted-foreground">Acompanhe lançamentos, pagamentos e fechamentos sem trocar de perfil.</p>
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
          titulo="Saldo consolidado"
          descricao="Posição financeira total para acompanhar o caixa geral."
          icone={BarChart3}
          para="/igreja/relatorios"
          contagem={Number(resumo?.saldoConsolidado ?? 0)}
        />
        <Atalho
          titulo="Contribuições pendentes"
          descricao="Lançamentos aguardando conferência."
          icone={HandCoins}
          para="/central/contribuicoes"
          contagem={contribuicoes.filter((item) => item.status_conferencia === "pendente").length}
        />
        <Atalho
          titulo="Pagamentos em aberto"
          descricao="Pagamentos aguardando decisão, quitação ou revisão."
          icone={FileText}
          para="/central/solicitacoes"
          contagem={pendentesPagamento}
        />
        <Atalho
          titulo="Fechamentos do mês"
          descricao="Sociedades com movimento no período."
          icone={BookCheck}
          para="/igreja/fechamentos"
          contagem={fechamentoPendente}
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
          contagem={(sociedades.data ?? []).filter((s) => s.status === "ativa").length}
        />
        <Atalho
          titulo="Categorias"
          descricao="Entradas e saídas financeiras."
          icone={Tags}
          para="/cadastros/categorias"
          carregando={categorias.isLoading}
          contagem={(categorias.data ?? []).filter((c) => c.ativo).length}
        />
        <Atalho
          titulo="Fornecedores"
          descricao="Prestadores e fornecedores."
          icone={Briefcase}
          para="/cadastros/fornecedores"
          carregando={fornecedores.isLoading}
          contagem={(fornecedores.data ?? []).filter((f) => f.ativo).length}
        />
      </div>
    </ShellPainel>
  );
}
