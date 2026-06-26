import { useState } from "react";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { DataTable, Coluna } from "@/components/painel/DataTable";
import { FormDialog } from "@/components/painel/FormDialog";
import { ConfirmDialog } from "@/components/painel/ConfirmDialog";
import { StatusContribuicaoBadge } from "@/components/sociedade/StatusContribuicaoBadge";
import { FormContribuicao } from "@/components/sociedade/FormContribuicao";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Paperclip } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSociedadeOperacional } from "@/contexts/SociedadeOperacionalContext";
import { formatarData, formatarMesAno, formatarMoeda } from "@/lib/format";
import {
  Contribuicao,
  useContribuicoesSociedade,
  useExcluirContribuicao,
} from "@/hooks/sociedade/useContribuicoesSociedade";

export default function Contribuicoes() {
  const { user, isAdmin } = useAuth();
  const { sociedadeSelecionada, sociedadeSelecionadaId } = useSociedadeOperacional();
  const { data, isLoading } = useContribuicoesSociedade(sociedadeSelecionadaId);
  const excluir = useExcluirContribuicao(sociedadeSelecionadaId);

  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Contribuicao | null>(null);
  const [confirmando, setConfirmando] = useState<Contribuicao | null>(null);

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
        return (
          <div className="flex justify-end gap-1">
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

  if (!sociedadeSelecionadaId || !user) {
    return (
      <ShellPainel titulo="Entradas" descricao="Selecione uma sociedade ativa para começar os lançamentos.">
        <p className="text-sm text-muted-foreground">
          Assim que escolher uma sociedade no painel, você poderá registrar, editar e revisar as entradas dela.
        </p>
      </ShellPainel>
    );
  }

  return (
    <ShellPainel
      titulo="Entradas"
      descricao={`Registre e acompanhe as entradas de ${sociedadeSelecionada?.nome ?? "uma sociedade"}.`}
    >
      <DataTable
        dados={data ?? []}
        colunas={colunas}
        carregando={isLoading}
        buscaPlaceholder="Buscar por membro ou forma..."
        filtrarPor={(c, t) =>
          c.membro_nome.toLowerCase().includes(t) || c.forma_pagamento.toLowerCase().includes(t)
        }
        acoes={
          <Button onClick={abrirNova}>
            <Plus className="h-4 w-4" />
            Nova contribuição
          </Button>
        }
      />

      <FormDialog
        open={aberto}
        onOpenChange={setAberto}
        titulo={editando ? "Editar entrada" : "Nova entrada"}
        descricao={editando ? "A correção fica registrada na auditoria do sistema." : undefined}
      >
        <FormContribuicao
          sociedadeId={sociedadeSelecionadaId}
          usuarioId={user.id}
          registro={editando}
          onConcluido={() => setAberto(false)}
          onCancelar={() => setAberto(false)}
        />
      </FormDialog>

      <ConfirmDialog
        open={!!confirmando}
        onOpenChange={(o) => !o && setConfirmando(null)}
        titulo="Excluir entrada?"
        descricao={`Esta ação removerá o registro de "${confirmando?.membro_nome}". Não é possível desfazer.`}
        textoConfirmar="Excluir"
        destrutivo
        onConfirmar={() => {
          if (confirmando) {
            excluir.mutate(confirmando.id);
            setConfirmando(null);
          }
        }}
      />
    </ShellPainel>
  );
}
