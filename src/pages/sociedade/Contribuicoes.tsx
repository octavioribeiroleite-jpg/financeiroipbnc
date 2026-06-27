import { useMemo, useState } from "react";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { DataTable, Coluna } from "@/components/painel/DataTable";
import { FormDialog } from "@/components/painel/FormDialog";
import { ConfirmDialog } from "@/components/painel/ConfirmDialog";
import { StatusContribuicaoBadge } from "@/components/sociedade/StatusContribuicaoBadge";
import { FormContribuicao } from "@/components/sociedade/FormContribuicao";
import { ModalConferirContribuicao } from "@/components/central/ModalConferirContribuicao";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Paperclip, CheckCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatarData, formatarMesAno, formatarMoeda } from "@/lib/format";
import { useSociedades } from "@/hooks/cadastros/useSociedades";
import {
  Contribuicao,
  useContribuicoesTodas,
  useExcluirContribuicao,
} from "@/hooks/sociedade/useContribuicoesSociedade";

export default function Contribuicoes() {
  const { user, isAdmin } = useAuth();
  const { data, isLoading } = useContribuicoesTodas();
  const { data: sociedades } = useSociedades();
  const excluir = useExcluirContribuicao(null);

  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Contribuicao | null>(null);
  const [confirmando, setConfirmando] = useState<Contribuicao | null>(null);
  const [conferindo, setConferindo] = useState<Contribuicao | null>(null);
  const [sociedadeFiltroId, setSociedadeFiltroId] = useState("todas");

  const sociedadesPorId = useMemo(() => {
    return new Map((sociedades ?? []).map((sociedade) => [sociedade.id, sociedade]));
  }, [sociedades]);

  const entradasFiltradas = useMemo(() => {
    const entradas = data ?? [];
    if (sociedadeFiltroId === "todas") return entradas;
    return entradas.filter((entrada) => entrada.sociedade_id === sociedadeFiltroId);
  }, [data, sociedadeFiltroId]);

  const sociedadeFormularioId = editando?.sociedade_id ?? (sociedadeFiltroId === "todas" ? null : sociedadeFiltroId);

  const abrirNova = () => {
    setEditando(null);
    setAberto(true);
  };
  const abrirEditar = (c: Contribuicao) => {
    setEditando(c);
    setAberto(true);
  };

  const colunas: Coluna<Contribuicao>[] = [
    {
      chave: "membro",
      cabecalho: "Membro",
      render: (c) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{c.membro_nome}</span>
          {c.comprovante_url && <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      ),
    },
    {
      chave: "sociedade",
      cabecalho: "Sociedade",
      render: (c) => <span className="font-medium">{sociedadesPorId.get(c.sociedade_id)?.nome ?? "—"}</span>,
    },
    { chave: "ref", cabecalho: "Referência", render: (c) => formatarMesAno(c.referencia_mes) },
    { chave: "valor", cabecalho: "Valor", render: (c) => formatarMoeda(Number(c.valor)) },
    { chave: "data", cabecalho: "Pagamento", render: (c) => formatarData(c.data_pagamento) },
    { chave: "forma", cabecalho: "Forma", render: (c) => c.forma_pagamento },
    {
      chave: "status",
      cabecalho: "Status",
      render: (c) => <StatusContribuicaoBadge status={c.status_conferencia} />,
    },
    {
      chave: "acoes",
      cabecalho: "",
      className: "w-1 text-right",
      render: (c) => {
        const editavel = isAdmin || c.status_conferencia === "pendente";
        const podeConferir = isAdmin && c.status_conferencia === "pendente";
        return (
          <div className="flex justify-end gap-1">
            {podeConferir && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConferindo(c)}
                title="Conferir entrada"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={!editavel}
              onClick={() => abrirEditar(c)}
              title={editavel ? "Editar" : "Já conferida — bloqueada para este perfil"}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!editavel}
              onClick={() => setConfirmando(c)}
              title={editavel ? "Excluir" : "Já conferida — bloqueada para este perfil"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (!user) {
    return (
      <ShellPainel titulo="Entradas" descricao="Entre no sistema para visualizar os lançamentos.">
        <p className="text-sm text-muted-foreground">
          Assim que entrar, você poderá registrar, editar e revisar as entradas.
        </p>
      </ShellPainel>
    );
  }

  return (
    <ShellPainel
      titulo="Entradas"
      descricao="Registre e acompanhe as entradas gerais ou filtre por sociedade."
    >
      <DataTable
        dados={entradasFiltradas}
        colunas={colunas}
        carregando={isLoading}
        buscaPlaceholder="Buscar por membro, sociedade ou forma..."
        filtrarPor={(c, t) =>
          c.membro_nome.toLowerCase().includes(t) ||
          c.forma_pagamento.toLowerCase().includes(t) ||
          (sociedadesPorId.get(c.sociedade_id)?.nome ?? "").toLowerCase().includes(t)
        }
        acoes={
          <>
            <Select value={sociedadeFiltroId} onValueChange={setSociedadeFiltroId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filtrar sociedade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as sociedades</SelectItem>
                {(sociedades ?? []).map((sociedade) => (
                  <SelectItem key={sociedade.id} value={sociedade.id}>
                    {sociedade.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={abrirNova}
              disabled={sociedadeFiltroId === "todas"}
              title={sociedadeFiltroId === "todas" ? "Escolha uma sociedade no filtro para lançar." : "Nova entrada"}
            >
              <Plus className="h-4 w-4" />
              Nova entrada
            </Button>
          </>
        }
      />

      <FormDialog
        open={aberto}
        onOpenChange={setAberto}
        titulo={editando ? "Editar entrada" : "Nova entrada"}
        descricao={editando ? "A correção fica registrada na auditoria do sistema." : undefined}
      >
        {sociedadeFormularioId && (
          <FormContribuicao
            sociedadeId={sociedadeFormularioId}
            usuarioId={user.id}
            registro={editando}
            onConcluido={() => setAberto(false)}
            onCancelar={() => setAberto(false)}
          />
        )}
      </FormDialog>

      <ConfirmDialog
        open={!!confirmando}
        onOpenChange={(o) => !o && setConfirmando(null)}
        titulo="Excluir entrada?"
        descricao={`Esta ação removerá o registro de "${confirmando?.membro_nome}". Não é possível desfazer.`}
        textoConfirmar="Excluir"
        destrutivo
        onConfirmar={async () => {
          if (confirmando) {
            await excluir.mutateAsync(confirmando.id);
            setConfirmando(null);
          }
        }}
      />

      <ModalConferirContribuicao
        contribuicao={conferindo}
        open={!!conferindo}
        onClose={() => setConferindo(null)}
      />
    </ShellPainel>
  );
}
