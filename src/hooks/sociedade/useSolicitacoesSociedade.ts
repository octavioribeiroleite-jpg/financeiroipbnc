import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "@/components/ui/sonner";

export type Solicitacao = Database["public"]["Tables"]["solicitacoes_pagamento"]["Row"];
export type StatusSolicitacao = Database["public"]["Enums"]["status_solicitacao"];

export interface SolicitacaoInput {
  fornecedor_id: string;
  categoria_id?: string | null;
  descricao: string;
  valor: number;
  vencimento: string;
  observacoes?: string | null;
  anexo_nota_url?: string | null;
  comprovantes_pagamento_urls?: string[];
  recibos_urls?: string[];
}


const KEY = (sociedadeId: string | null) => ["solicitacoes", sociedadeId] as const;
const ERRO_BLOQUEADO = "Este pagamento já entrou em processamento e não pode mais ser alterado como rascunho.";

function invalidarFluxo(qc: ReturnType<typeof useQueryClient>, sociedadeId: string | null) {
  qc.invalidateQueries({ queryKey: KEY(sociedadeId) });
  qc.invalidateQueries({ queryKey: ["solicitacoes"] });
  qc.invalidateQueries({ queryKey: ["central", "solicitacoes"] });
  qc.invalidateQueries({ queryKey: ["resumo-sociedade"] });
  qc.invalidateQueries({ queryKey: ["igreja"] });
}

export function useSolicitacoesSociedade(sociedadeId: string | null) {
  return useQuery({
    queryKey: KEY(sociedadeId),
    enabled: !!sociedadeId,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_pagamento")
        .select("*")
        .eq("sociedade_id", sociedadeId!)
        .order("data_criacao", { ascending: false });
      if (error) throw error;
      return data as Solicitacao[];
    },
  });
}

export function useCriarSolicitacao(sociedadeId: string | null, criadoPor: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SolicitacaoInput & { status: "rascunho" | "enviada" }) => {
      if (!sociedadeId || !criadoPor) throw new Error("Usuário sem sociedade vinculada.");
      const { error } = await supabase.from("solicitacoes_pagamento").insert({
        sociedade_id: sociedadeId,
        criado_por: criadoPor,
        fornecedor_id: input.fornecedor_id,
        categoria_id: input.categoria_id || null,
        descricao: input.descricao,
        valor: input.valor,
        vencimento: input.vencimento,
        observacoes: input.observacoes || null,
        anexo_nota_url: input.anexo_nota_url || null,
        comprovantes_pagamento_urls: input.comprovantes_pagamento_urls ?? [],
        recibos_urls: input.recibos_urls ?? [],
        status: input.status,
      });
      if (error) throw error;
    },

    onSuccess: (_, input) => {
      invalidarFluxo(qc, sociedadeId);
      toast.success(input.status === "enviada" ? "Pagamento liberado" : "Rascunho salvo", {
        description:
          input.status === "enviada"
            ? "A solicitação entrou na fila central de processamento."
            : "Você ainda pode editar antes de liberar para processamento.",
      });
    },
    onError: (e: Error) => toast.error("Falha ao salvar", { description: e.message }),
  });
}

export function useAtualizarSolicitacao(sociedadeId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: SolicitacaoInput & { id: string; status?: "rascunho" | "enviada" }) => {
      const { data, error } = await supabase
        .from("solicitacoes_pagamento")
        .update({
          fornecedor_id: input.fornecedor_id,
          categoria_id: input.categoria_id || null,
          descricao: input.descricao,
          valor: input.valor,
          vencimento: input.vencimento,
          observacoes: input.observacoes || null,
          anexo_nota_url: input.anexo_nota_url || null,
          comprovantes_pagamento_urls: input.comprovantes_pagamento_urls ?? [],
          recibos_urls: input.recibos_urls ?? [],
          ...(input.status ? { status: input.status } : {}),
        })

        .eq("id", id)
        .eq("status", "rascunho")
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(ERRO_BLOQUEADO);
    },
    onSuccess: (_, input) => {
      invalidarFluxo(qc, sociedadeId);
      toast.success(input.status === "enviada" ? "Pagamento liberado" : "Rascunho atualizado");
    },
    onError: (e: Error) => toast.error("Falha ao atualizar", { description: e.message }),
  });
}

export function useEnviarSolicitacao(sociedadeId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("solicitacoes_pagamento")
        .update({ status: "enviada" })
        .eq("id", id)
        .eq("status", "rascunho")
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(ERRO_BLOQUEADO);
    },
    onSuccess: () => {
      invalidarFluxo(qc, sociedadeId);
      toast.success("Pagamento liberado", { description: "A solicitação entrou na fila central." });
    },
    onError: (e: Error) => toast.error("Falha ao enviar", { description: e.message }),
  });
}

export function useExcluirSolicitacao(sociedadeId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("solicitacoes_pagamento")
        .delete()
        .eq("id", id)
        .eq("status", "rascunho")
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(ERRO_BLOQUEADO);
    },
    onSuccess: () => {
      invalidarFluxo(qc, sociedadeId);
      toast.success("Rascunho removido");
    },
    onError: (e: Error) => toast.error("Falha ao remover", { description: e.message }),
  });
}

// --- Edição estendida: rascunho OU enviada (enquanto a Central não iniciar análise) ---

const STATUS_EDITAVEIS: StatusSolicitacao[] = ["rascunho", "enviada"];
const ERRO_EDITAVEL =
  "Este pagamento já está em análise, aprovado ou pago e não pode mais ser alterado.";

export function useAtualizarSolicitacaoEditavel(sociedadeId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: SolicitacaoInput & { id: string; status?: "rascunho" | "enviada" }) => {
      const update: Database["public"]["Tables"]["solicitacoes_pagamento"]["Update"] = {
        fornecedor_id: input.fornecedor_id,
        categoria_id: input.categoria_id || null,
        descricao: input.descricao,
        valor: input.valor,
        vencimento: input.vencimento,
        observacoes: input.observacoes || null,
        anexo_nota_url: input.anexo_nota_url || null,
        comprovantes_pagamento_urls: input.comprovantes_pagamento_urls ?? [],
        recibos_urls: input.recibos_urls ?? [],
      };
      if (input.status) update.status = input.status;

      const { data, error } = await supabase
        .from("solicitacoes_pagamento")
        .update(update)
        .eq("id", id)
        .in("status", STATUS_EDITAVEIS)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(ERRO_EDITAVEL);
    },
    onSuccess: (_, input) => {
      invalidarFluxo(qc, sociedadeId);
      toast.success(input.status === "enviada" ? "Pagamento atualizado" : "Rascunho atualizado", {
        description:
          input.status === "enviada"
            ? "As alterações já estão disponíveis para a Central."
            : undefined,
      });
    },
    onError: (e: Error) => toast.error("Falha ao atualizar", { description: e.message }),
  });
}

export function useExcluirSolicitacaoEditavel(sociedadeId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("solicitacoes_pagamento")
        .delete()
        .eq("id", id)
        .in("status", STATUS_EDITAVEIS)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(ERRO_EDITAVEL);
    },
    onSuccess: () => {
      invalidarFluxo(qc, sociedadeId);
      toast.success("Pagamento removido");
    },
    onError: (e: Error) => toast.error("Falha ao remover", { description: e.message }),
  });
}

