import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "@/components/ui/sonner";

export type Solicitacao = Database["public"]["Tables"]["solicitacoes_pagamento"]["Row"];

const KEY = ["central", "solicitacoes"] as const;
const ERRO_CONCORRENCIA = "A solicitação mudou de status em outra sessão. Atualize a tela e tente novamente.";

function invalidarFluxo(qc: ReturnType<typeof useQueryClient>, sociedadeId?: string | null) {
  qc.invalidateQueries({ queryKey: KEY });
  qc.invalidateQueries({ queryKey: ["solicitacoes"] });
  qc.invalidateQueries({ queryKey: ["resumo-sociedade"] });
  qc.invalidateQueries({ queryKey: ["extrato-sociedade"] });
  qc.invalidateQueries({ queryKey: ["igreja"] });
  qc.invalidateQueries({ queryKey: ["fechamentos"] });
  if (sociedadeId) {
    qc.invalidateQueries({ queryKey: ["solicitacoes", sociedadeId] });
    qc.invalidateQueries({ queryKey: ["resumo-sociedade", sociedadeId] });
    qc.invalidateQueries({ queryKey: ["extrato-sociedade", sociedadeId] });
  }
}

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

export function useIniciarAnalise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, conferidoPor }: { id: string; conferidoPor: string }) => {
      const { data, error } = await supabase
        .from("solicitacoes_pagamento")
        .update({ status: "em_analise", conferido_por: conferidoPor })
        .eq("id", id)
        .eq("status", "enviada")
        .select("id, sociedade_id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(ERRO_CONCORRENCIA);
      return data;
    },
    onSuccess: (data) => {
      invalidarFluxo(qc, data.sociedade_id);
      toast.success("Análise iniciada", { description: "O pagamento ficou reservado para processamento." });
    },
    onError: (e: Error) => toast.error("Falha ao iniciar análise", { description: e.message }),
  });
}

export function useAprovarSolicitacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, conferidoPor }: { id: string; conferidoPor: string }) => {
      const { data, error } = await supabase
        .from("solicitacoes_pagamento")
        .update({ status: "aprovada", conferido_por: conferidoPor, motivo_recusa: null })
        .eq("id", id)
        .eq("status", "em_analise")
        .select("id, sociedade_id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(ERRO_CONCORRENCIA);
      return data;
    },
    onSuccess: (data) => {
      invalidarFluxo(qc, data.sociedade_id);
      toast.success("Solicitação aprovada", { description: "O pagamento já pode ser quitado." });
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
      const { data, error } = await supabase
        .from("solicitacoes_pagamento")
        .update({ status: "recusada", motivo_recusa: motivo, conferido_por: conferidoPor })
        .eq("id", id)
        .eq("status", "em_analise")
        .select("id, sociedade_id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(ERRO_CONCORRENCIA);
      return data;
    },
    onSuccess: (data) => {
      invalidarFluxo(qc, data.sociedade_id);
      toast.success("Solicitação recusada", { description: "O motivo ficou registrado no histórico." });
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
      const { data, error } = await supabase
        .from("solicitacoes_pagamento")
        .update({ status: "rascunho", motivo_recusa: observacao, conferido_por: conferidoPor })
        .eq("id", id)
        .eq("status", "em_analise")
        .select("id, sociedade_id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(ERRO_CONCORRENCIA);
      return data;
    },
    onSuccess: (data) => {
      invalidarFluxo(qc, data.sociedade_id);
      toast.success("Solicitação devolvida", { description: "Ela voltou para rascunho e poderá ser corrigida." });
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

      const { data, error } = await supabase
        .from("solicitacoes_pagamento")
        .update(update)
        .eq("id", id)
        .eq("status", "aprovada")
        .select("id, sociedade_id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(ERRO_CONCORRENCIA);
      return data;
    },
    onSuccess: (data) => {
      invalidarFluxo(qc, data.sociedade_id);
      toast.success("Pagamento registrado", {
        description: "A saída foi confirmada e os saldos foram atualizados.",
      });
    },
    onError: (e: Error) => toast.error("Falha ao registrar pagamento", { description: e.message }),
  });
}
