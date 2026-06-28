import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Contribuicao = Database["public"]["Tables"]["contribuicoes"]["Row"];
export type StatusConferencia = Database["public"]["Enums"]["status_conferencia"];

const KEY = ["central", "contribuicoes"] as const;

function invalidarContribuicoes(qc: ReturnType<typeof useQueryClient>, sociedadesIds: string[]) {
  qc.invalidateQueries({ queryKey: KEY });
  qc.invalidateQueries({ queryKey: ["contribuicoes"] });
  qc.invalidateQueries({ queryKey: ["resumo-sociedade"] });
  qc.invalidateQueries({ queryKey: ["extrato-sociedade"] });
  qc.invalidateQueries({ queryKey: ["igreja"] });
  qc.invalidateQueries({ queryKey: ["fechamentos"] });

  for (const sociedadeId of sociedadesIds) {
    qc.invalidateQueries({ queryKey: ["contribuicoes", sociedadeId] });
    qc.invalidateQueries({ queryKey: ["resumo-sociedade", sociedadeId] });
    qc.invalidateQueries({ queryKey: ["extrato-sociedade", sociedadeId] });
  }
}

export function useContribuicoesCentral() {
  return useQuery({
    queryKey: KEY,
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

interface ConferirInput {
  id: string;
  status: StatusConferencia;
  observacao?: string | null;
  conferidoPor: string;
}

export function useConferirContribuicao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, observacao, conferidoPor }: ConferirInput) => {
      const update: Database["public"]["Tables"]["contribuicoes"]["Update"] = {
        status_conferencia: status,
        conferido_por: conferidoPor,
        data_conferencia: new Date().toISOString(),
      };
      if (observacao !== undefined) update.observacao = observacao;
      const { data, error } = await supabase
        .from("contribuicoes")
        .update(update)
        .eq("id", id)
        .select("id, sociedade_id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      invalidarContribuicoes(qc, [data.sociedade_id]);
      toast.success("Conferência registrada");
    },
    onError: (e: Error) => toast.error("Falha ao conferir", { description: e.message }),
  });
}

interface ConferirLoteInput {
  ids: string[];
  conferidoPor: string;
}

export function useConferirContribuicoesEmLote() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, conferidoPor }: ConferirLoteInput) => {
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from("contribuicoes")
        .update({
          status_conferencia: "conferida",
          conferido_por: conferidoPor,
          data_conferencia: new Date().toISOString(),
        })
        .in("id", ids)
        .eq("status_conferencia", "pendente")
        .select("id, sociedade_id");

      if (error) throw error;
      return data ?? [];
    },
    onSuccess: (data, variables) => {
      const sociedadesIds = Array.from(new Set(data.map((item) => item.sociedade_id)));
      invalidarContribuicoes(qc, sociedadesIds);

      if (data.length === 0) {
        toast.info("Nenhuma entrada pendente foi conferida");
        return;
      }

      if (data.length < variables.ids.length) {
        toast.warning("Conferência concluída parcialmente", {
          description: `${data.length} de ${variables.ids.length} entradas ainda estavam pendentes e foram conferidas.`,
        });
        return;
      }

      toast.success(`${data.length} entradas conferidas`);
    },
    onError: (e: Error) => toast.error("Falha ao conferir entradas", { description: e.message }),
  });
}
