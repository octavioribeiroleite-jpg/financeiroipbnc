import { useMemo, useState } from "react";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { DataTable, Coluna } from "@/components/painel/DataTable";
import { FormDialog } from "@/components/painel/FormDialog";
import { ConfirmDialog } from "@/components/painel/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Eye, Trash2, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSociedadeOperacional } from "@/contexts/SociedadeOperacionalContext";
import { formatarData, formatarMoeda } from "@/lib/format";
import {
  Solicitacao,
  StatusSolicitacao,
  useEnviarSolicitacao,
  useExcluirSolicitacao,
  useSolicitacoesSociedade,
} from "@/hooks/sociedade/useSolicitacoesSociedade";
import {
  ROTULO_STATUS,
  StatusSolicitacaoBadge,
} from "@/components/sociedade/StatusSolicitacaoBadge";
import { FormSolicitacao } from "@/components/sociedade/FormSolicitacao";
import { ViewSolicitacao } from "@/components/sociedade/ViewSolicitacao";
import { useFornecedores } from "@/hooks/cadastros/useFornecedores";

const FILTROS_STATUS: { valor: StatusSolicitacao | "todas"; rotulo: string }[] = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "rascunho", rotulo: ROTULO_STATUS.rascunho },
  { valor: "enviada", rotulo: ROTULO_STATUS.enviada },
  { valor: "em_analise", rotulo: ROTULO_STATUS.em_analise },
  { valor: "aprovada", rotulo: ROTULO_STATUS.aprovada },
  { valor: "recusada", rotulo: ROTULO_STATUS.recusada },
  { valor: "paga", rotulo: ROTULO_STATUS.paga },
];

export default function Solicitacoes() {
  const { user } = useAuth();
  const { sociedadeSelecionada, sociedadeSelecionadaId } = useSociedadeOperacional();
  const { data, isLoading } = useSolicitacoesSociedade(sociedadeSelecionadaId);
  const { data: fornecedores } = useFornecedores();
  const excluir = useExcluirSolicitacao(sociedadeSelecionadaId);
  const enviar = useEnviarSolicitacao(sociedadeSelecionadaId);

  const [filtroStatus, setFiltroStatus] = useState<StatusSolicitacao | "todas">("todas");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Solicitacao | null>(null);
  const [visualizando, setVisualizando] = useState<Solicitacao | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<Solicitacao | null>(null);
  const [confirmandoEnvio, setConfirmandoEnvio] = useState<Solicitacao | null>(null);

  const filtradas = useMemo(() => {
    const lista = data ?? [];
    return filtroStatus === "todas" ? lista : lista.filter((s) => s.status === filtroStatus);
  }, [data, filtroStatus]);

  const nomeFornecedor = (id: string) =>
    fornecedores?.find((f) => f.id === id)?.nome_fantasia ?? "—";

  const abrirNova = () => {
    setEditando(null);
    setAberto(true);
  };

  const colunas: Coluna<Solicitacao>[] = [
    {
      chave: "descricao",
      cabecalho: "Descrição",
      render: (s) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{s.descricao}</p>
          <p className="truncate text-xs text-muted-foreground">{nomeFornecedor(s.fornecedor_id)}</p>
        </div>
      ),
    },
    { chave: "valor", cabecalho: "Valor", render: (s) => formatarMoeda(Number(s.valor)) },
    { chave: "venc", cabecalho: "Vencimento", render: (s) => formatarData(s.vencimento) },
    {
      chave: "status",
      cabecalho: "Status",
      render: (s) => <StatusSolicitacaoBadge status={s.status} />,
    },
    {
      chave: "acoes",
      cabecalho: "",
      className: "w-1 text-right",
      render: (s) => {
        const podeEditar = s.status === "rascunho" || s.status === "enviada";
        const podeExcluir = s.status === "rascunho";
        const podeEnviar = s.status === "rascunho";
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => setVisualizando(s)} title="Visualizar">
              <Eye className="h-4 w-4" />
            </Button>
            {podeEnviar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmandoEnvio(s)}
                title="Enviar para análise"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={!podeEditar}
              onClick={() => {
                setEditando(s);
                setAberto(true);
              }}
              title={podeEditar ? "Editar" : "Não editável neste status"}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!podeExcluir}
              onClick={() => setConfirmandoExclusao(s)}
              title={podeExcluir ? "Excluir" : "Apenas rascunhos podem ser excluídos"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (!sociedadeSelecionadaId || !user) {
    return (
      <ShellPainel
        titulo="Solicitações de pagamento"
        descricao="Selecione uma sociedade para centralizar os pagamentos."
      >
        <p className="text-sm text-muted-foreground">
          Com a sociedade ativa definida, você consegue lançar, aprovar e quitar pagamentos em sequência.
        </p>
      </ShellPainel>
    );
  }

  return (
    <ShellPainel
      titulo="Solicitações de pagamento"
      descricao={`Crie e acompanhe os pagamentos de ${sociedadeSelecionada?.nome ?? "uma sociedade"}.`}
    >
      <DataTable
        dados={filtradas}
        colunas={colunas}
        carregando={isLoading}
        buscaPlaceholder="Buscar por descrição..."
        filtrarPor={(s, t) =>
          s.descricao.toLowerCase().includes(t) ||
          nomeFornecedor(s.fornecedor_id).toLowerCase().includes(t)
        }
        acoes={
          <div className="flex flex-wrap gap-2">
            <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as typeof filtroStatus)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTROS_STATUS.map((f) => (
                  <SelectItem key={f.valor} value={f.valor}>
                    {f.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={abrirNova}>
              <Plus className="h-4 w-4" />
              Nova solicitação
            </Button>
          </div>
        }
      />

      <FormDialog
        open={aberto}
        onOpenChange={setAberto}
        titulo={editando ? "Editar solicitação" : "Nova solicitação"}
      >
        <FormSolicitacao
          sociedadeId={sociedadeId}
          usuarioId={user.id}
          registro={editando}
          onConcluido={() => setAberto(false)}
          onCancelar={() => setAberto(false)}
        />
      </FormDialog>

      <FormDialog
        open={!!visualizando}
        onOpenChange={(o) => !o && setVisualizando(null)}
        titulo="Detalhes da solicitação"
      >
        {visualizando && <ViewSolicitacao registro={visualizando} />}
      </FormDialog>

      <ConfirmDialog
        open={!!confirmandoEnvio}
        onOpenChange={(o) => !o && setConfirmandoEnvio(null)}
        titulo="Enviar solicitação para análise?"
        descricao="Após o envio, a tesouraria central poderá analisar e aprovar/recusar este pedido."
        textoConfirmar="Enviar"
        onConfirmar={() => {
          if (confirmandoEnvio) {
            enviar.mutate(confirmandoEnvio.id);
            setConfirmandoEnvio(null);
          }
        }}
      />

      <ConfirmDialog
        open={!!confirmandoExclusao}
        onOpenChange={(o) => !o && setConfirmandoExclusao(null)}
        titulo="Excluir solicitação?"
        descricao={`O rascunho "${confirmandoExclusao?.descricao}" será removido permanentemente.`}
        textoConfirmar="Excluir"
        destrutivo
        onConfirmar={() => {
          if (confirmandoExclusao) {
            excluir.mutate(confirmandoExclusao.id);
            setConfirmandoExclusao(null);
          }
        }}
      />
    </ShellPainel>
  );
}
