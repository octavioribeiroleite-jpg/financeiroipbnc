import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Contribuicao = Database["public"]["Tables"]["contribuicoes"]["Row"];
export type StatusConferencia = Database["public"]["Enums"]["status_conferencia"];

const KEY = ["central", "contribuicoes"] as const;

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
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["contribuicoes"] });
      qc.invalidateQueries({ queryKey: ["contribuicoes", data.sociedade_id] });
      qc.invalidateQueries({ queryKey: ["resumo-sociedade", data.sociedade_id] });
      qc.invalidateQueries({ queryKey: ["extrato-sociedade", data.sociedade_id] });
      qc.invalidateQueries({ queryKey: ["igreja"] });
      qc.invalidateQueries({ queryKey: ["fechamentos"] });
      toast.success("Conferência registrada");
    },
    onError: (e: Error) => toast.error("Falha ao conferir", { description: e.message }),
  });
}
