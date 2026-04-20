import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Fornecedor = Database["public"]["Tables"]["fornecedores"]["Row"];
export interface FornecedorInput {
  nome_fantasia: string;
  razao_social?: string | null;
  cnpj?: string | null;
  categoria_id?: string | null;
  banco?: string | null;
  chave_pix?: string | null;
  observacoes?: string | null;
  ativo?: boolean;
}

const KEY = ["fornecedores"] as const;

export function useFornecedores() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .order("nome_fantasia", { ascending: true });
      if (error) throw error;
      return data as Fornecedor[];
    },
  });
}

export function useCriarFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: FornecedorInput) => {
      const { error } = await supabase.from("fornecedores").insert({
        nome_fantasia: input.nome_fantasia,
        razao_social: input.razao_social || null,
        cnpj: input.cnpj || null,
        categoria_id: input.categoria_id || null,
        banco: input.banco || null,
        chave_pix: input.chave_pix || null,
        observacoes: input.observacoes || null,
        ativo: input.ativo ?? true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Fornecedor criado");
    },
    onError: (e: Error) => toast.error("Falha ao criar fornecedor", { description: e.message }),
  });
}

export function useAtualizarFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: FornecedorInput & { id: string }) => {
      const { error } = await supabase
        .from("fornecedores")
        .update({
          nome_fantasia: input.nome_fantasia,
          razao_social: input.razao_social || null,
          cnpj: input.cnpj || null,
          categoria_id: input.categoria_id || null,
          banco: input.banco || null,
          chave_pix: input.chave_pix || null,
          observacoes: input.observacoes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Fornecedor atualizado");
    },
    onError: (e: Error) => toast.error("Falha ao atualizar", { description: e.message }),
  });
}

export function useAlternarStatusFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("fornecedores").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Status atualizado");
    },
    onError: (e: Error) => toast.error("Falha ao atualizar status", { description: e.message }),
  });
}
