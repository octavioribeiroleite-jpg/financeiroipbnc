import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "@/components/ui/sonner";
import { bindMetodoRpc } from "@/lib/supabaseRpc";

export type Solicitacao = Database["public"]["Tables"]["solicitacoes_pagamento"]["Row"];
export type AcaoProcessamento = "aprovar" | "aprovar_pagar" | "pagar" | "devolver" | "recusar";

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

interface ProcessarInput {
  id: string;
  acao: AcaoProcessamento;
  motivo?: string | null;
  dataPagamento?: string | null;
  comprovanteUrl?: string | null;
  observacoes?: string | null;
}

interface ProcessarResultado {
  id: string;
  sociedade_id: string;
  status: Solicitacao["status"];
}

type RpcProcessar = (
  funcao: "processar_solicitacao_pagamento",
  argumentos: {
    _solicitacao_id: string;
    _acao: string;
    _motivo: string | null;
    _data_pagamento: string | null;
    _comprovante_url: string | null;
    _observacoes: string | null;
  },
) => PromiseLike<{
  data: ProcessarResultado[] | null;
  error: { message: string } | null;
}>;

const MENSAGENS: Record<AcaoProcessamento, { titulo: string; descricao: string }> = {
  aprovar: {
    titulo: "Pagamento aprovado",
    descricao: "A solicitação ficou disponível para quitação.",
  },
  aprovar_pagar: {
    titulo: "Pagamento concluído",
    descricao: "A solicitação foi aprovada, paga e lançada no extrato.",
  },
  pagar: {
    titulo: "Pagamento concluído",
    descricao: "A saída foi registrada no extrato da sociedade.",
  },
  devolver: {
    titulo: "Solicitação devolvida",
    descricao: "Ela voltou para rascunho e poderá ser corrigida.",
  },
  recusar: {
    titulo: "Solicitação recusada",
    descricao: "O motivo ficou registrado no histórico.",
  },
};

export function useProcessarSolicitacao() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      acao,
      motivo = null,
      dataPagamento = null,
      comprovanteUrl = null,
      observacoes = null,
    }: ProcessarInput) => {
      const rpc = bindMetodoRpc(supabase) as unknown as RpcProcessar;
      const { data, error } = await rpc("processar_solicitacao_pagamento", {
        _solicitacao_id: id,
        _acao: acao,
        _motivo: motivo,
        _data_pagamento: dataPagamento,
        _comprovante_url: comprovanteUrl,
        _observacoes: observacoes,
      });

      if (error) throw new Error(error.message);
      const resultado = data?.[0];
      if (!resultado) throw new Error(ERRO_CONCORRENCIA);
      return { ...resultado, acao };
    },
    onSuccess: (resultado) => {
      invalidarFluxo(qc, resultado.sociedade_id);
      const mensagem = MENSAGENS[resultado.acao];
      toast.success(mensagem.titulo, { description: mensagem.descricao });
    },
    onError: (e: Error) => toast.error("Não foi possível concluir", { description: e.message }),
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
