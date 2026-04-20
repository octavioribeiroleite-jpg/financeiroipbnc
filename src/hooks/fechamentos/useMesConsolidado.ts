import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Verifica se o mês (a partir de uma data ISO YYYY-MM-DD) já está consolidado
 * para a sociedade indicada.
 */
export function useMesConsolidado(sociedadeId: string | null, dataIso: string | null) {
  const enabled = !!sociedadeId && !!dataIso && /^\d{4}-\d{2}-\d{2}$/.test(dataIso);
  const ano = dataIso ? Number(dataIso.slice(0, 4)) : null;
  const mes = dataIso ? Number(dataIso.slice(5, 7)) : null;

  return useQuery({
    queryKey: ["mes-consolidado", sociedadeId, ano, mes] as const,
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("fechamentos_mensais")
        .select("id")
        .eq("sociedade_id", sociedadeId!)
        .eq("ano", ano!)
        .eq("mes", mes!)
        .eq("status", "consolidado")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}
