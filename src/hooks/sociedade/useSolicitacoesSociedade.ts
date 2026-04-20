import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Solicitacao = Database["public"]["Tables"]["solicitacoes_pagamento"]["Row"];
export type StatusSolicitacao = Database["public"]["Enums"]["status_solicitacao"];

export interface SolicitacaoInput {
  fornecedor_id: string;
  categoria_id?: string | null;
  descricao: string;
  valor: number;
  vencimento: string; // YYYY-MM-DD
  observacoes?: string | null;
  anexo_nota_url?: string | null;
}

const KEY = (sociedadeId: string | null) => ["solicitacoes", sociedadeId] as const;

export function useSolicitacoesSociedade(sociedadeId: string | null) {
  return useQuery({
    queryKey: KEY(sociedadeId),
    enabled: !!sociedadeId,
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
        status: input.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(sociedadeId) });
      qc.invalidateQueries({ queryKey: ["resumo-sociedade", sociedadeId] });
      toast.success("Pagamento salvo");
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
      const { error } = await supabase
        .from("solicitacoes_pagamento")
        .update({
          fornecedor_id: input.fornecedor_id,
          categoria_id: input.categoria_id || null,
          descricao: input.descricao,
          valor: input.valor,
          vencimento: input.vencimento,
          observacoes: input.observacoes || null,
          anexo_nota_url: input.anexo_nota_url || null,
          ...(input.status ? { status: input.status } : {}),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(sociedadeId) });
      qc.invalidateQueries({ queryKey: ["resumo-sociedade", sociedadeId] });
      toast.success("Pagamento atualizado");
    },
    onError: (e: Error) => toast.error("Falha ao atualizar", { description: e.message }),
  });
}

export function useEnviarSolicitacao(sociedadeId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("solicitacoes_pagamento")
        .update({ status: "enviada" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(sociedadeId) });
      toast.success("Pagamento liberado para processamento");
    },
    onError: (e: Error) => toast.error("Falha ao enviar", { description: e.message }),
  });
}

export function useExcluirSolicitacao(sociedadeId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("solicitacoes_pagamento").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(sociedadeId) });
      toast.success("Pagamento removido");
    },
    onError: (e: Error) => toast.error("Falha ao remover", { description: e.message }),
  });
}
