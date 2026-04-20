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
import { Banknote, Eye, Search } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useSociedadeOperacional } from "@/contexts/SociedadeOperacionalContext";

type StatusSol = Database["public"]["Enums"]["status_solicitacao"];

const ABAS: { valor: string; rotulo: string; filtros?: StatusSol[] }[] = [
  { valor: "pendentes", rotulo: "Pendentes", filtros: ["enviada"] },
  { valor: "em_analise", rotulo: "Em análise", filtros: ["em_analise"] },
  { valor: "aprovadas", rotulo: "Aprovadas", filtros: ["aprovada"] },
  { valor: "pagas", rotulo: "Pagas", filtros: ["paga"] },
  { valor: "todas", rotulo: "Todas" },
];

export default function CentralSolicitacoes() {
  const { data: solicitacoes = [], isLoading } = useSolicitacoesCentral();
  const { data: sociedades = [] } = useSociedades();
  const { data: fornecedores = [] } = useFornecedores();
  const { sociedadeSelecionada, sociedadeSelecionadaId, setSociedadeSelecionadaId } = useSociedadeOperacional();

  const [aba, setAba] = useState("pendentes");
  const [selecionada, setSelecionada] = useState<Solicitacao | null>(null);
  const [modalAnalise, setModalAnalise] = useState(false);
  const [modalPagamento, setModalPagamento] = useState(false);

  const nomeSociedade = (id: string) => sociedades.find((s) => s.id === id)?.nome ?? "—";
  const nomeFornecedor = (id: string) => fornecedores.find((f) => f.id === id)?.nome_fantasia ?? "—";

  const filtradas = useMemo(() => {
    const abaConf = ABAS.find((a) => a.valor === aba);
    return solicitacoes.filter((s) => {
      if (abaConf?.filtros && !abaConf.filtros.includes(s.status)) return false;
      if (sociedadeSelecionadaId && s.sociedade_id !== sociedadeSelecionadaId) return false;
      return true;
    });
  }, [solicitacoes, aba, sociedadeSelecionadaId]);

  const totais = useMemo(() => {
    const pendentes = solicitacoes.filter((s) => s.status === "enviada");
    const aprovadas = solicitacoes.filter((s) => s.status === "aprovada");
    return {
      qtdPendentes: pendentes.length,
      valorAprovadas: aprovadas.reduce((sum, s) => sum + Number(s.valor), 0),
      qtdAprovadas: aprovadas.length,
      vencendoSemana: solicitacoes.filter((s) => {
        if (sociedadeSelecionadaId && s.sociedade_id !== sociedadeSelecionadaId) return false;
        if (!["enviada", "em_analise", "aprovada"].includes(s.status)) return false;
        const hoje = new Date();
        const fim = new Date();
        fim.setDate(hoje.getDate() + 7);
        const venc = new Date(s.vencimento);
        return venc >= hoje && venc <= fim;
      }).length,
    };
  }, [sociedadeSelecionadaId, solicitacoes]);

  const abrirAnalise = (s: Solicitacao) => {
    setSelecionada(s);
    setModalAnalise(true);
  };
  const abrirPagamento = (s: Solicitacao) => {
    setSelecionada(s);
    setModalPagamento(true);
  };

  const colunas: Coluna<Solicitacao>[] = [
    {
      chave: "sociedade",
      cabecalho: "Sociedade",
      render: (s) => <span className="text-sm">{nomeSociedade(s.sociedade_id)}</span>,
    },
    {
      chave: "fornecedor",
      cabecalho: "Fornecedor",
      render: (s) => <span className="text-sm">{nomeFornecedor(s.fornecedor_id)}</span>,
    },
    {
      chave: "descricao",
      cabecalho: "Descrição",
      render: (s) => <span className="text-sm font-medium line-clamp-1">{s.descricao}</span>,
    },
    {
      chave: "valor",
      cabecalho: "Valor",
      render: (s) => <span className="text-sm font-medium">{formatarMoeda(Number(s.valor))}</span>,
    },
    {
      chave: "venc",
      cabecalho: "Vencimento",
      render: (s) => <span className="text-sm">{formatarData(s.vencimento)}</span>,
    },
    {
      chave: "status",
      cabecalho: "Status",
      render: (s) => <StatusSolicitacaoBadge status={s.status} />,
    },
    {
      chave: "acoes",
      cabecalho: "",
      className: "text-right",
      render: (s) => (
        <div className="flex justify-end gap-1">
          {s.status === "aprovada" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => abrirPagamento(s)}
              title="Registrar pagamento"
            >
              <Banknote className="h-4 w-4" />
              Pagar
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => abrirAnalise(s)}
            title={s.status === "enviada" ? "Analisar" : "Visualizar"}
          >
            {s.status === "enviada" ? <Search className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ShellPainel
      titulo="Pagamentos"
      descricao={`Acompanhe, aprove e quite pagamentos de ${sociedadeSelecionada?.nome ?? "uma sociedade"}.`}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Aguardando decisão</p>
          <p className="text-2xl font-semibold">{totais.qtdPendentes}</p>
        </div>
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Aprovadas a pagar</p>
          <p className="text-2xl font-semibold text-success">{totais.qtdAprovadas}</p>
          <p className="text-xs text-muted-foreground">{formatarMoeda(totais.valorAprovadas)}</p>
        </div>
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Vencendo nesta semana</p>
          <p className="text-2xl font-semibold">{totais.vencendoSemana}</p>
        </div>
      </div>

      <Tabs value={aba} onValueChange={setAba} className="mb-3">
        <TabsList>
          {ABAS.map((a) => (
            <TabsTrigger key={a.valor} value={a.valor}>
              {a.rotulo}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        dados={filtradas}
        colunas={colunas}
        carregando={isLoading}
        buscaPlaceholder="Buscar por descrição ou fornecedor..."
        filtrarPor={(s, t) =>
          s.descricao.toLowerCase().includes(t) ||
          nomeFornecedor(s.fornecedor_id).toLowerCase().includes(t) ||
          nomeSociedade(s.sociedade_id).toLowerCase().includes(t)
        }
        vazioMensagem="Nenhum pagamento encontrado."
        acoes={
          <Select value={sociedadeSelecionadaId ?? undefined} onValueChange={setSociedadeSelecionadaId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sociedade" />
            </SelectTrigger>
            <SelectContent>
              {sociedades.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nome}
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
