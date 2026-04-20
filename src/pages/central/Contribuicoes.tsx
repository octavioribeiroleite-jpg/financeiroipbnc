import { useMemo, useState } from "react";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { DataTable, type Coluna } from "@/components/painel/DataTable";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useContribuicoesCentral,
  type Contribuicao,
  type StatusConferencia,
} from "@/hooks/central/useContribuicoesCentral";
import { useSociedades } from "@/hooks/cadastros/useSociedades";
import { StatusContribuicaoBadge } from "@/components/sociedade/StatusContribuicaoBadge";
import { ModalConferirContribuicao } from "@/components/central/ModalConferirContribuicao";
import { formatarData, formatarMesAno, formatarMoeda } from "@/lib/format";
import { CheckCheck, Eye } from "lucide-react";

export default function CentralContribuicoes() {
  const { data: contribuicoes = [], isLoading } = useContribuicoesCentral();
  const { data: sociedades = [] } = useSociedades();

  const [filtroSociedade, setFiltroSociedade] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<StatusConferencia | "todos">("todos");
  const [selecionada, setSelecionada] = useState<Contribuicao | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const filtradas = useMemo(() => {
    return contribuicoes.filter((c) => {
      if (filtroSociedade !== "todas" && c.sociedade_id !== filtroSociedade) return false;
      if (filtroStatus !== "todos" && c.status_conferencia !== filtroStatus) return false;
      return true;
    });
  }, [contribuicoes, filtroSociedade, filtroStatus]);

  const totais = useMemo(() => {
    const pendentes = contribuicoes.filter((c) => c.status_conferencia === "pendente");
    const conferidasHoje = contribuicoes.filter((c) => {
      if (c.status_conferencia !== "conferida" || !c.data_conferencia) return false;
      const d = new Date(c.data_conferencia);
      const hoje = new Date();
      return d.toDateString() === hoje.toDateString();
    });
    return {
      qtdPendentes: pendentes.length,
      valorPendente: pendentes.reduce((sum, c) => sum + Number(c.valor), 0),
      qtdConferidasHoje: conferidasHoje.length,
    };
  }, [contribuicoes]);

  const nomeSociedade = (id: string) => sociedades.find((s) => s.id === id)?.nome ?? "—";

  const abrirModal = (c: Contribuicao) => {
    setSelecionada(c);
    setModalAberto(true);
  };

  const colunas: Coluna<Contribuicao>[] = [
    {
      chave: "sociedade",
      cabecalho: "Sociedade",
      render: (c) => <span className="text-sm">{nomeSociedade(c.sociedade_id)}</span>,
    },
    {
      chave: "membro",
      cabecalho: "Membro",
      render: (c) => <span className="text-sm font-medium">{c.membro_nome}</span>,
    },
    {
      chave: "ref",
      cabecalho: "Referência",
      render: (c) => <span className="text-sm">{formatarMesAno(c.referencia_mes)}</span>,
    },
    {
      chave: "valor",
      cabecalho: "Valor",
      render: (c) => (
        <span className="text-sm font-medium">{formatarMoeda(Number(c.valor))}</span>
      ),
    },
    {
      chave: "data",
      cabecalho: "Pagamento",
      render: (c) => <span className="text-sm">{formatarData(c.data_pagamento)}</span>,
    },
    {
      chave: "forma",
      cabecalho: "Forma",
      render: (c) => <span className="text-sm">{c.forma_pagamento}</span>,
    },
    {
      chave: "status",
      cabecalho: "Status",
      render: (c) => <StatusContribuicaoBadge status={c.status_conferencia} />,
    },
    {
      chave: "acoes",
      cabecalho: "",
      className: "text-right",
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => abrirModal(c)} title={c.status_conferencia === "pendente" ? "Conferir" : "Visualizar"}>
            {c.status_conferencia === "pendente" ? <CheckCheck className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ShellPainel
      titulo="Conferir contribuições"
      descricao="Acompanhe e confira os lançamentos enviados pelas sociedades."
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pendentes de conferência</p>
          <p className="text-2xl font-semibold">{totais.qtdPendentes}</p>
          <p className="text-xs text-muted-foreground">{formatarMoeda(totais.valorPendente)} em aberto</p>
        </div>
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Conferidas hoje</p>
          <p className="text-2xl font-semibold text-success">{totais.qtdConferidasHoje}</p>
        </div>
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total de registros</p>
          <p className="text-2xl font-semibold">{contribuicoes.length}</p>
        </div>
      </div>

      <DataTable
        dados={filtradas}
        colunas={colunas}
        carregando={isLoading}
        buscaPlaceholder="Buscar por membro ou forma..."
        filtrarPor={(c, t) =>
          c.membro_nome.toLowerCase().includes(t) ||
          c.forma_pagamento.toLowerCase().includes(t) ||
          nomeSociedade(c.sociedade_id).toLowerCase().includes(t)
        }
        vazioMensagem="Nenhuma contribuição encontrada."
        acoes={
          <>
            <Select value={filtroSociedade} onValueChange={setFiltroSociedade}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sociedade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as sociedades</SelectItem>
                {sociedades.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filtroStatus}
              onValueChange={(v) => setFiltroStatus(v as StatusConferencia | "todos")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="conferida">Conferida</SelectItem>
                <SelectItem value="divergente">Divergente</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <ModalConferirContribuicao
        contribuicao={selecionada}
        open={modalAberto}
        onClose={() => {
          setModalAberto(false);
          setSelecionada(null);
        }}
      />
    </ShellPainel>
  );
}
