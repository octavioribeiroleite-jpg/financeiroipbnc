import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Categoria = Database["public"]["Tables"]["categorias"]["Row"];
export type TipoCategoria = Database["public"]["Enums"]["tipo_categoria"];
export interface CategoriaInput {
  nome: string;
  tipo: TipoCategoria;
  ativo?: boolean;
}

const KEY = ["categorias"] as const;

export function useCategorias() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as Categoria[];
    },
  });
}

export function useCriarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CategoriaInput) => {
      const { error } = await supabase.from("categorias").insert({
        nome: input.nome,
        tipo: input.tipo,
        ativo: input.ativo ?? true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Categoria criada");
    },
    onError: (e: Error) => toast.error("Falha ao criar categoria", { description: e.message }),
  });
}

export function useAtualizarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: CategoriaInput & { id: string }) => {
      const { error } = await supabase.from("categorias").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Categoria atualizada");
    },
    onError: (e: Error) => toast.error("Falha ao atualizar", { description: e.message }),
  });
}

export function useAlternarStatusCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("categorias").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Status atualizado");
    },
    onError: (e: Error) => toast.error("Falha ao atualizar status", { description: e.message }),
  });
}
