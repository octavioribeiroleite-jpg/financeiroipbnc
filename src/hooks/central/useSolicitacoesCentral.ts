import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Solicitacao = Database["public"]["Tables"]["solicitacoes_pagamento"]["Row"];

const KEY = ["central", "solicitacoes"] as const;

export function useSolicitacoesCentral() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_pagamento")
        .select("*")
        .order("data_criacao", { ascending: false });
      if (error) throw error;
      return data as Solicitacao[];
    },
  });
}

function useUpdateSolicitacao() {
  const qc = useQueryClient();
  return (
    successMsg: string,
    extraInvalidate?: () => void,
  ) =>
    useMutation({
      mutationFn: async ({
        id,
        patch,
      }: {
        id: string;
        patch: Database["public"]["Tables"]["solicitacoes_pagamento"]["Update"];
      }) => {
        const { error } = await supabase
          .from("solicitacoes_pagamento")
          .update(patch)
          .eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: KEY });
        qc.invalidateQueries({ queryKey: ["solicitacoes"] });
        extraInvalidate?.();
        toast.success(successMsg);
      },
      onError: (e: Error) => toast.error("Falha na operação", { description: e.message }),
    });
}

export function useIniciarAnalise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, conferidoPor }: { id: string; conferidoPor: string }) => {
      const { error } = await supabase
        .from("solicitacoes_pagamento")
        .update({ status: "em_analise", conferido_por: conferidoPor })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Análise iniciada");
    },
    onError: (e: Error) => toast.error("Falha ao iniciar análise", { description: e.message }),
  });
}

export function useAprovarSolicitacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, conferidoPor }: { id: string; conferidoPor: string }) => {
      const { error } = await supabase
        .from("solicitacoes_pagamento")
        .update({ status: "aprovada", conferido_por: conferidoPor, motivo_recusa: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Solicitação aprovada");
    },
    onError: (e: Error) => toast.error("Falha ao aprovar", { description: e.message }),
  });
}

export function useRecusarSolicitacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      motivo,
      conferidoPor,
    }: {
      id: string;
      motivo: string;
      conferidoPor: string;
    }) => {
      const { error } = await supabase
        .from("solicitacoes_pagamento")
        .update({
          status: "recusada",
          motivo_recusa: motivo,
          conferido_por: conferidoPor,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Solicitação recusada");
    },
    onError: (e: Error) => toast.error("Falha ao recusar", { description: e.message }),
  });
}

export function useDevolverSolicitacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      observacao,
      conferidoPor,
    }: {
      id: string;
      observacao: string;
      conferidoPor: string;
    }) => {
      const { error } = await supabase
        .from("solicitacoes_pagamento")
        .update({
          status: "rascunho",
          motivo_recusa: observacao,
          conferido_por: conferidoPor,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["solicitacoes"] });
      toast.success("Solicitação devolvida para ajuste");
    },
    onError: (e: Error) => toast.error("Falha ao devolver", { description: e.message }),
  });
}

export interface PagamentoInput {
  id: string;
  dataPagamento: string;
  comprovanteUrl: string;
  pagoPor: string;
  observacoes?: string | null;
}

export function useRegistrarPagamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      dataPagamento,
      comprovanteUrl,
      pagoPor,
      observacoes,
    }: PagamentoInput) => {
      const update: Database["public"]["Tables"]["solicitacoes_pagamento"]["Update"] = {
        status: "paga",
        data_pagamento: dataPagamento,
        anexo_comprovante_url: comprovanteUrl,
        pago_por: pagoPor,
      };
      if (observacoes !== undefined) update.observacoes = observacoes;
      const { error } = await supabase
        .from("solicitacoes_pagamento")
        .update(update)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["solicitacoes"] });
      qc.invalidateQueries({ queryKey: ["resumo-sociedade"] });
      toast.success("Pagamento registrado");
    },
    onError: (e: Error) => toast.error("Falha ao registrar pagamento", { description: e.message }),
  });
}
