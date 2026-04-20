import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type RegistroAuditoria = Database["public"]["Tables"]["auditoria"]["Row"];

export interface FiltroAuditoria {
  inicio?: string | null;
  fim?: string | null;
  modulo?: string | null;
  acao?: string | null;
  usuarioId?: string | null;
  pagina: number;
  porPagina: number;
}

export interface RespostaAuditoria {
  registros: RegistroAuditoria[];
  total: number;
}

export function useAuditoria(filtros: FiltroAuditoria) {
  return useQuery({
    queryKey: ["igreja", "auditoria", filtros] as const,
    queryFn: async (): Promise<RespostaAuditoria> => {
      const from = (filtros.pagina - 1) * filtros.porPagina;
      const to = from + filtros.porPagina - 1;
      let q = supabase
        .from("auditoria")
        .select("*", { count: "exact" })
        .order("data_hora", { ascending: false })
        .range(from, to);
      if (filtros.modulo) q = q.eq("modulo", filtros.modulo);
      if (filtros.acao) q = q.eq("acao", filtros.acao);
      if (filtros.usuarioId) q = q.eq("usuario_id", filtros.usuarioId);
      if (filtros.inicio) q = q.gte("data_hora", filtros.inicio);
      if (filtros.fim) q = q.lte("data_hora", filtros.fim + "T23:59:59");
      const { data, error, count } = await q;
      if (error) throw error;
      return { registros: (data ?? []) as RegistroAuditoria[], total: count ?? 0 };
    },
  });
}
