import { useMemo, useState } from "react";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { DataTable, type Coluna } from "@/components/painel/DataTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSolicitacoesCentral, type Solicitacao } from "@/hooks/central/useSolicitacoesCentral";
import { useSociedades } from "@/hooks/cadastros/useSociedades";
import { useFornecedores } from "@/hooks/cadastros/useFornecedores";
import { StatusSolicitacaoBadge } from "@/components/sociedade/StatusSolicitacaoBadge";
import { ModalAnalisarSolicitacao } from "@/components/central/ModalAnalisarSolicitacao";
import { ModalRegistrarPagamento } from "@/components/central/ModalRegistrarPagamento";
import { formatarData, formatarMoeda } from "@/lib/format";
import {
  type AbaPagamento,
  calcularResumoPagamentos,
  hojeISO,
  pertenceAbaPagamento,
} from "@/lib/pagamentos";
import { Banknote, CircleAlert, Eye, Search } from "lucide-react";
import { useSociedadeOperacional } from "@/contexts/SociedadeOperacionalContext";
import { cn } from "@/lib/utils";

const TODAS_SOCIEDADES = "__todas__";

const ABAS: { valor: AbaPagamento; rotulo: string }[] = [
  { valor: "pendentes", rotulo: "Pendentes" },
  { valor: "em_analise", rotulo: "Em análise" },
  { valor: "aprovadas", rotulo: "Aprovadas" },
  { valor: "pagas", rotulo: "Pagas" },
  { valor: "todas", rotulo: "Todas" },
];

const PRIORIDADE_STATUS: Record<Solicitacao["status"], number> = {
  aprovada: 0,
  enviada: 1,
  em_analise: 2,
  rascunho: 3,
  recusada: 4,
  paga: 5,
};

export default function CentralSolicitacoes() {
  const { data: solicitacoes = [], isLoading } = useSolicitacoesCentral();
  const { data: sociedades = [] } = useSociedades();
  const { data: fornecedores = [] } = useFornecedores();
  const { sociedadeSelecionada, sociedadeSelecionadaId, setSociedadeSelecionadaId } = useSociedadeOperacional();

  const [aba, setAba] = useState<AbaPagamento>("pendentes");
  const [selecionada, setSelecionada] = useState<Solicitacao | null>(null);
  const [modalAnalise, setModalAnalise] = useState(false);
  const [modalPagamento, setModalPagamento] = useState(false);

  const dataHoje = hojeISO();
  const nomeSociedade = (id: string) => sociedades.find((s) => s.id === id)?.nome ?? "—";
  const nomeFornecedor = (id: string) => fornecedores.find((f) => f.id === id)?.nome_fantasia ?? "—";

  const baseSociedade = useMemo(
    () =>
      sociedadeSelecionadaId
        ? solicitacoes.filter((s) => s.sociedade_id === sociedadeSelecionadaId)
        : solicitacoes,
    [sociedadeSelecionadaId, solicitacoes],
  );

  const resumo = useMemo(
    () => calcularResumoPagamentos(baseSociedade, dataHoje),
    [baseSociedade, dataHoje],
  );

  const filtradas = useMemo(
    () =>
      baseSociedade
        .filter((s) => pertenceAbaPagamento(s.status, aba))
        .sort((a, b) => {
          const prioridade = PRIORIDADE_STATUS[a.status] - PRIORIDADE_STATUS[b.status];
          if (prioridade !== 0) return prioridade;
          const vencimento = a.vencimento.localeCompare(b.vencimento);
          if (vencimento !== 0) return vencimento;
          return b.data_criacao.localeCompare(a.data_criacao);
        }),
    [aba, baseSociedade],
  );

  const abrirAnalise = (solicitacao: Solicitacao) => {
    setSelecionada(solicitacao);
    setModalAnalise(true);
  };

  const abrirPagamento = (solicitacao: Solicitacao) => {
    setSelecionada(solicitacao);
    setModalPagamento(true);
  };

  const colunas: Coluna<Solicitacao>[] = [
    {
      chave: "sociedade",
      cabecalho: "Sociedade",
      className: "min-w-[120px]",
      render: (s) => <span className="text-sm">{nomeSociedade(s.sociedade_id)}</span>,
    },
    {
      chave: "fornecedor",
      cabecalho: "Fornecedor",
      className: "min-w-[150px]",
      render: (s) => <span className="text-sm">{nomeFornecedor(s.fornecedor_id)}</span>,
    },
    {
      chave: "descricao",
      cabecalho: "Descrição",
      className: "min-w-[170px] max-w-[280px]",
      render: (s) => <span className="block truncate text-sm font-medium" title={s.descricao}>{s.descricao}</span>,
    },
    {
      chave: "valor",
      cabecalho: "Valor",
      className: "min-w-[110px] whitespace-nowrap",
      render: (s) => <span className="text-sm font-medium">{formatarMoeda(Number(s.valor))}</span>,
    },
    {
      chave: "venc",
      cabecalho: "Vencimento",
      className: "min-w-[130px] whitespace-nowrap",
      render: (s) => {
        const vencida = ["enviada", "em_analise", "aprovada"].includes(s.status) && s.vencimento < dataHoje;
        return (
          <span className={cn("text-sm", vencida && "font-semibold text-destructive")}>
            {formatarData(s.vencimento)}
          </span>
        );
      },
    },
    {
      chave: "status",
      cabecalho: "Status",
      className: "min-w-[125px]",
      render: (s) => <StatusSolicitacaoBadge status={s.status} />,
    },
    {
      chave: "acoes",
      cabecalho: "Ações",
      className:
        "sticky right-0 z-10 min-w-[145px] whitespace-nowrap border-l bg-card text-right shadow-[-8px_0_14px_-14px_rgba(15,23,42,0.55)]",
      render: (s) => (
        <div className="flex justify-end gap-1">
          {s.status === "aprovada" && (
            <Button variant="default" size="sm" onClick={() => abrirPagamento(s)} title="Registrar pagamento">
              <Banknote className="h-4 w-4" />
              Pagar
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => abrirAnalise(s)}
            title={s.status === "enviada" || s.status === "em_analise" ? "Processar pagamento" : "Visualizar detalhes"}
          >
            {s.status === "enviada" || s.status === "em_analise" ? (
              <Search className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ShellPainel
      titulo="Pagamentos"
      descricao={
        sociedadeSelecionada
          ? `Acompanhe, aprove e quite pagamentos de ${sociedadeSelecionada.nome}.`
          : "Acompanhe, aprove e quite pagamentos de todas as sociedades."
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Aguardando decisão</p>
          <p className="text-2xl font-semibold">{resumo.qtdPendentes}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Aprovadas a pagar</p>
          <p className="text-2xl font-semibold text-success">{resumo.qtdAprovadas}</p>
          <p className="text-xs text-muted-foreground">{formatarMoeda(resumo.valorAprovadas)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Vencendo em até 7 dias</p>
          <p className="text-2xl font-semibold">{resumo.vencendoSemana}</p>
        </div>
        <div className={cn("rounded-lg border bg-card p-4", resumo.vencidas > 0 && "border-destructive/30 bg-destructive/5")}>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Vencidas e não pagas</p>
            {resumo.vencidas > 0 && <CircleAlert className="h-4 w-4 text-destructive" />}
          </div>
          <p className={cn("text-2xl font-semibold", resumo.vencidas > 0 && "text-destructive")}>{resumo.vencidas}</p>
        </div>
      </div>

      <Tabs value={aba} onValueChange={(valor) => setAba(valor as AbaPagamento)} className="mb-3">
        <TabsList className="h-auto flex-wrap justify-start">
          {ABAS.map((item) => (
            <TabsTrigger key={item.valor} value={item.valor} className="gap-2">
              {item.rotulo}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                {resumo.porAba[item.valor]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        dados={filtradas}
        colunas={colunas}
        carregando={isLoading}
        buscaPlaceholder="Buscar por descrição, fornecedor ou sociedade..."
        filtrarPor={(s, termo) =>
          s.descricao.toLowerCase().includes(termo) ||
          nomeFornecedor(s.fornecedor_id).toLowerCase().includes(termo) ||
          nomeSociedade(s.sociedade_id).toLowerCase().includes(termo)
        }
        vazioMensagem="Nenhum pagamento encontrado neste filtro."
        acoes={
          <Select
            value={sociedadeSelecionadaId ?? TODAS_SOCIEDADES}
            onValueChange={(valor) => setSociedadeSelecionadaId(valor === TODAS_SOCIEDADES ? null : valor)}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Todas as sociedades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS_SOCIEDADES}>Todas as sociedades</SelectItem>
              {sociedades.map((sociedade) => (
                <SelectItem key={sociedade.id} value={sociedade.id}>
                  {sociedade.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <ModalAnalisarSolicitacao
        solicitacao={selecionada}
        open={modalAnalise}
        onClose={() => {
          setModalAnalise(false);
          setSelecionada(null);
        }}
      />
      <ModalRegistrarPagamento
        solicitacao={selecionada}
        open={modalPagamento}
        onClose={() => {
          setModalPagamento(false);
          setSelecionada(null);
        }}
      />
    </ShellPainel>
  );
}
