import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Sociedade = Database["public"]["Tables"]["sociedades"]["Row"];
export type SociedadeInput = Pick<Sociedade, "nome" | "tipo"> & { status?: Sociedade["status"] };

const KEY = ["sociedades"] as const;

export function useSociedades() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sociedades")
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as Sociedade[];
    },
  });
}

export function useCriarSociedade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SociedadeInput) => {
      const { error } = await supabase.from("sociedades").insert({
        nome: input.nome,
        tipo: input.tipo,
        status: input.status ?? "ativa",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Sociedade criada");
    },
    onError: (e: Error) => toast.error("Falha ao criar sociedade", { description: e.message }),
  });
}

export function useAtualizarSociedade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: SociedadeInput & { id: string }) => {
      const { error } = await supabase.from("sociedades").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Sociedade atualizada");
    },
    onError: (e: Error) => toast.error("Falha ao atualizar", { description: e.message }),
  });
}

export function useAlternarStatusSociedade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativa }: { id: string; ativa: boolean }) => {
      const { error } = await supabase
        .from("sociedades")
        .update({ status: ativa ? "ativa" : "inativa" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Status atualizado");
    },
    onError: (e: Error) => toast.error("Falha ao atualizar status", { description: e.message }),
  });
}
