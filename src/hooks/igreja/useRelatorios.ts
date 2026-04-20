import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export interface FiltroBase {
  inicio: string; // YYYY-MM-DD
  fim: string; // YYYY-MM-DD
  sociedadeId?: string | null;
}

type Contrib = Database["public"]["Tables"]["contribuicoes"]["Row"];
type Solic = Database["public"]["Tables"]["solicitacoes_pagamento"]["Row"];
type Mov = Database["public"]["Tables"]["movimentacoes_sociedade"]["Row"];

export function useRelatorioContribuicoes(filtros: FiltroBase & {
  status?: Database["public"]["Enums"]["status_conferencia"] | null;
  forma?: string | null;
}) {
  return useQuery({
    queryKey: ["igreja", "rel-contrib", filtros] as const,
    queryFn: async (): Promise<Contrib[]> => {
      let q = supabase
        .from("contribuicoes")
        .select("*")
        .gte("data_pagamento", filtros.inicio)
        .lte("data_pagamento", filtros.fim)
        .order("data_pagamento", { ascending: false });
      if (filtros.sociedadeId) q = q.eq("sociedade_id", filtros.sociedadeId);
      if (filtros.status) q = q.eq("status_conferencia", filtros.status);
      if (filtros.forma) q = q.eq("forma_pagamento", filtros.forma);
      const { data, error } = await q;
      if (error) throw error;
      return data as Contrib[];
    },
  });
}

export function useRelatorioPagamentos(filtros: FiltroBase & {
  status?: Database["public"]["Enums"]["status_solicitacao"] | null;
  categoriaId?: string | null;
  fornecedorId?: string | null;
}) {
  return useQuery({
    queryKey: ["igreja", "rel-pag", filtros] as const,
    queryFn: async (): Promise<Solic[]> => {
      // Filtra pelo vencimento (sempre presente). Para status "paga" também considera data_pagamento.
      let q = supabase
        .from("solicitacoes_pagamento")
        .select("*")
        .gte("vencimento", filtros.inicio)
        .lte("vencimento", filtros.fim)
        .order("vencimento", { ascending: false });
      if (filtros.sociedadeId) q = q.eq("sociedade_id", filtros.sociedadeId);
      if (filtros.status) q = q.eq("status", filtros.status);
      if (filtros.categoriaId) q = q.eq("categoria_id", filtros.categoriaId);
      if (filtros.fornecedorId) q = q.eq("fornecedor_id", filtros.fornecedorId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Solic[];
    },
  });
}

export function useRelatorioMovimentacoes(filtros: FiltroBase) {
  return useQuery({
    queryKey: ["igreja", "rel-mov", filtros] as const,
    enabled: !!filtros.sociedadeId,
    queryFn: async (): Promise<Mov[]> => {
      const { data, error } = await supabase
        .from("movimentacoes_sociedade")
        .select("*")
        .eq("sociedade_id", filtros.sociedadeId!)
        .gte("data_movimento", filtros.inicio)
        .lte("data_movimento", filtros.fim)
        .order("data_movimento", { ascending: false });
      if (error) throw error;
      return data as Mov[];
    },
  });
}
