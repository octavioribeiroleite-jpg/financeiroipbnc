import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Contribuicao = Database["public"]["Tables"]["contribuicoes"]["Row"];
export interface ContribuicaoInput {
  membro_nome: string;
  referencia_mes: string; // YYYY-MM-DD
  valor: number;
  data_pagamento: string; // YYYY-MM-DD
  forma_pagamento: string;
  comprovante_url?: string | null;
  comprovantes_pagamento_urls?: string[];
  recibos_urls?: string[];
  observacao?: string | null;
}


const KEY = (sociedadeId: string | null) => ["contribuicoes", sociedadeId] as const;

function invalidarDadosFinanceiros(qc: ReturnType<typeof useQueryClient>, sociedadeId: string | null) {
  qc.invalidateQueries({ queryKey: ["contribuicoes"] });
  qc.invalidateQueries({ queryKey: KEY(sociedadeId) });
  qc.invalidateQueries({ queryKey: ["resumo-sociedade"] });
  qc.invalidateQueries({ queryKey: ["igreja"] });
  qc.invalidateQueries({ queryKey: ["extrato-sociedade"] });
  qc.invalidateQueries({ queryKey: ["fechamentos"] });
}

export function useContribuicoesSociedade(sociedadeId: string | null) {
  return useQuery({
    queryKey: KEY(sociedadeId),
    enabled: !!sociedadeId,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contribuicoes")
        .select("*")
        .eq("sociedade_id", sociedadeId!)
        .order("data_pagamento", { ascending: false });
      if (error) throw error;
      return data as Contribuicao[];
    },
  });
}

export function useContribuicoesTodas() {
  return useQuery({
    queryKey: ["contribuicoes", "todas"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contribuicoes")
        .select("*")
        .order("data_pagamento", { ascending: false });
      if (error) throw error;
      return data as Contribuicao[];
    },
  });
}

export function useCriarContribuicao(sociedadeId: string | null, criadoPor: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ContribuicaoInput) => {
      if (!sociedadeId || !criadoPor) throw new Error("Usuário sem sociedade vinculada.");
      const { error } = await supabase.from("contribuicoes").insert({
        sociedade_id: sociedadeId,
        criado_por: criadoPor,
        membro_nome: input.membro_nome,
        referencia_mes: input.referencia_mes,
        valor: input.valor,
        data_pagamento: input.data_pagamento,
        forma_pagamento: input.forma_pagamento,
        comprovante_url: input.comprovante_url ?? null,
        comprovantes_pagamento_urls: input.comprovantes_pagamento_urls ?? [],
        recibos_urls: input.recibos_urls ?? [],
        observacao: input.observacao ?? null,
      });
      if (error) throw error;
    },

    onSuccess: () => {
      invalidarDadosFinanceiros(qc, sociedadeId);
      toast.success("Contribuição registrada");
    },
    onError: (e: Error) => toast.error("Falha ao registrar", { description: e.message }),
  });
}

export function useAtualizarContribuicao(sociedadeId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ContribuicaoInput & { id: string }) => {
      const { error } = await supabase
        .from("contribuicoes")
        .update({
          membro_nome: input.membro_nome,
          referencia_mes: input.referencia_mes,
          valor: input.valor,
          data_pagamento: input.data_pagamento,
          forma_pagamento: input.forma_pagamento,
          comprovante_url: input.comprovante_url ?? null,
          comprovantes_pagamento_urls: input.comprovantes_pagamento_urls ?? [],
          recibos_urls: input.recibos_urls ?? [],
          observacao: input.observacao ?? null,
        })

        .eq("id", id)
        .select("id")
        .single();
      if (error) throw error;
    },
    onSuccess: () => {
      invalidarDadosFinanceiros(qc, sociedadeId);
      toast.success("Contribuição atualizada");
    },
    onError: (e: Error) => toast.error("Falha ao atualizar", { description: e.message }),
  });
}

export function useExcluirContribuicao(sociedadeId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contribuicoes").delete().eq("id", id).select("id").single();
      if (error) throw error;
    },
    onSuccess: () => {
      invalidarDadosFinanceiros(qc, sociedadeId);
      toast.success("Contribuição removida");
    },
    onError: (e: Error) => toast.error("Falha ao remover", { description: e.message }),
  });
}
