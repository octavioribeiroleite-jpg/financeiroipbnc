import { useMemo, useState } from "react";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { DataTable, Coluna } from "@/components/painel/DataTable";
import { FormDialog } from "@/components/painel/FormDialog";
import { ConfirmDialog } from "@/components/painel/ConfirmDialog";
import { StatusContribuicaoBadge } from "@/components/sociedade/StatusContribuicaoBadge";
import { FormContribuicao } from "@/components/sociedade/FormContribuicao";
import { ModalConferirContribuicao } from "@/components/central/ModalConferirContribuicao";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCheck, Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatarData, formatarMesAno, formatarMoeda } from "@/lib/format";
import { useSociedades } from "@/hooks/cadastros/useSociedades";
import { useConferirContribuicoesEmLote } from "@/hooks/central/useContribuicoesCentral";
import {
  Contribuicao,
  useContribuicoesTodas,
  useExcluirContribuicao,
} from "@/hooks/sociedade/useContribuicoesSociedade";

export default function ContribuicoesComLote() {
  const { user, isAdmin } = useAuth();
  const { data, isLoading } = useContribuicoesTodas();
  const { data: sociedades } = useSociedades();
  const excluir = useExcluirContribuicao(null);
  const conferirEmLote = useConferirContribuicoesEmLote();

  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Contribuicao | null>(null);
  const [confirmando, setConfirmando] = useState<Contribuicao | null>(null);
  const [conferindo, setConferindo] = useState<Contribuicao | null>(null);
  const [confirmandoLote, setConfirmandoLote] = useState(false);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [sociedadeFiltroId, setSociedadeFiltroId] = useState("todas");

  const sociedadesPorId = useMemo(
    () => new Map((sociedades ?? []).map((sociedade) => [sociedade.id, sociedade])),
    [sociedades],
  );

  const entradasFiltradas = useMemo(() => {
    const entradas = data ?? [];
    return sociedadeFiltroId === "todas"
      ? entradas
      : entradas.filter((entrada) => entrada.sociedade_id === sociedadeFiltroId);
  }, [data, sociedadeFiltroId]);

  const pendentes = entradasFiltradas.filter((entrada) => entrada.status_conferencia === "pendente");
  const todasSelecionadas = pendentes.length > 0 && pendentes.every((entrada) => selecionadas.includes(entrada.id));
  const algumaSelecionada = pendentes.some((entrada) => selecionadas.includes(entrada.id));
  const sociedadeFormularioId = editando?.sociedade_id ?? (sociedadeFiltroId === "todas" ? null : sociedadeFiltroId);

  const alternarEntrada = (id: string, marcada: boolean) => {
    setSelecionadas((atuais) =>
      marcada ? Array.from(new Set([...atuais, id])) : atuais.filter((item) => item !== id),
    );
  };

  const alternarTodas = () => {
    const ids = pendentes.map((entrada) => entrada.id);
    setSelecionadas((atuais) =>
      todasSelecionadas
        ? atuais.filter((id) => !ids.includes(id))
        : Array.from(new Set([...atuais, ...ids])),
    );
  };

  const colunas: Coluna<Contribuicao>[] = [
    {
      chave: "selecao",
      cabecalho: isAdmin ? (
        <Checkbox
          checked={todasSelecionadas ? true : algumaSelecionada ? "indeterminate" : false}
          onCheckedChange={alternarTodas}
          disabled={pendentes.length === 0}
          aria-label="Selecionar todas as entradas pendentes"
          title="Selecionar todas as pendentes do filtro atual"
        />
      ) : null,
      className: "w-12",
      render: (entrada) =>
        isAdmin && entrada.status_conferencia === "pendente" ? (
          <Checkbox
            checked={selecionadas.includes(entrada.id)}
            onCheckedChange={(marcada) => alternarEntrada(entrada.id, marcada === true)}
            aria-label={`Selecionar entrada de ${entrada.membro_nome}`}
          />
        ) : null,
    },
    {
      chave: "membro",
      cabecalho: "Membro",
      render: (entrada) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{entrada.membro_nome}</span>
          {entrada.comprovante_url && <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      ),
    },
    {
      chave: "sociedade",
      cabecalho: "Sociedade",
      render: (entrada) => <span className="font-medium">{sociedadesPorId.get(entrada.sociedade_id)?.nome ?? "—"}</span>,
    },
    { chave: "ref", cabecalho: "Referência", render: (entrada) => formatarMesAno(entrada.referencia_mes) },
    { chave: "valor", cabecalho: "Valor", render: (entrada) => formatarMoeda(Number(entrada.valor)) },
    { chave: "data", cabecalho: "Pagamento", render: (entrada) => formatarData(entrada.data_pagamento) },
    { chave: "forma", cabecalho: "Forma", render: (entrada) => entrada.forma_pagamento },
    {
      chave: "status",
      cabecalho: "Status",
      render: (entrada) => <StatusContribuicaoBadge status={entrada.status_conferencia} />,
    },
    {
      chave: "acoes",
      cabecalho: "",
      className: "w-1 text-right",
      render: (entrada) => {
        const editavel = isAdmin || entrada.status_conferencia === "pendente";
        const podeConferir = isAdmin && entrada.status_conferencia === "pendente";
        return (
          <div className="flex justify-end gap-1">
            {podeConferir && (
              <Button variant="ghost" size="sm" onClick={() => setConferindo(entrada)} title="Conferir entrada">
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={!editavel}
              onClick={() => {
                setEditando(entrada);
                setAberto(true);
              }}
              title={editavel ? "Editar" : "Já conferida — bloqueada para este perfil"}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!editavel}
              onClick={() => setConfirmando(entrada)}
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
        <p className="text-sm text-muted-foreground">Entre para registrar, editar e revisar as entradas.</p>
      </ShellPainel>
    );
  }

  return (
    <ShellPainel titulo="Entradas" descricao="Registre e acompanhe as entradas gerais ou filtre por sociedade.">
      <DataTable
        dados={entradasFiltradas}
        colunas={colunas}
        carregando={isLoading}
        buscaPlaceholder="Buscar por membro, sociedade ou forma..."
        filtrarPor={(entrada, termo) =>
          entrada.membro_nome.toLowerCase().includes(termo) ||
          entrada.forma_pagamento.toLowerCase().includes(termo) ||
          (sociedadesPorId.get(entrada.sociedade_id)?.nome ?? "").toLowerCase().includes(termo)
        }
        acoes={
          <>
            <Select
              value={sociedadeFiltroId}
              onValueChange={(valor) => {
                setSociedadeFiltroId(valor);
                setSelecionadas([]);
              }}
            >
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filtrar sociedade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as sociedades</SelectItem>
                {(sociedades ?? []).map((sociedade) => (
                  <SelectItem key={sociedade.id} value={sociedade.id}>{sociedade.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => setConfirmandoLote(true)}
                disabled={selecionadas.length === 0 || conferirEmLote.isPending}
              >
                <CheckCheck className="h-4 w-4" />
                Conferir selecionadas{selecionadas.length ? ` (${selecionadas.length})` : ""}
              </Button>
            )}
            <Button
              onClick={() => {
                setEditando(null);
                setAberto(true);
              }}
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
        onOpenChange={(abriu) => !abriu && setConfirmando(null)}
        titulo="Excluir entrada?"
        descricao={`Esta ação removerá o registro de "${confirmando?.membro_nome}". Não é possível desfazer.`}
        textoConfirmar="Excluir"
        destrutivo
        onConfirmar={async () => {
          if (!confirmando) return;
          await excluir.mutateAsync(confirmando.id);
          setConfirmando(null);
        }}
      />

      <ConfirmDialog
        open={confirmandoLote}
        onOpenChange={setConfirmandoLote}
        titulo={`Conferir ${selecionadas.length} entrada(s)?`}
        descricao="Todas as entradas selecionadas serão marcadas como conferidas e passarão a compor o saldo financeiro."
        textoConfirmar="Conferir todas"
        onConfirmar={async () => {
          await conferirEmLote.mutateAsync({ ids: selecionadas, conferidoPor: user.id });
          setSelecionadas([]);
          setConfirmandoLote(false);
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
