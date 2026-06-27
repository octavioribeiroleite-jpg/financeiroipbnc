import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResumoSociedade {
  saldoAtual: number;
  contribuicoesMes: number;
  pagamentosMes: number;
  solicitacoesPendentes: number;
}

function inicioMesIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function useResumoSociedade(sociedadeId: string | null) {
  return useQuery({
    queryKey: ["resumo-sociedade", sociedadeId] as const,
    enabled: !!sociedadeId,
    queryFn: async (): Promise<ResumoSociedade> => {
      const inicio = inicioMesIso();

      const [movRes, solicRes] = await Promise.all([
        supabase
          .from("movimentacoes_sociedade")
          .select("tipo, valor, confirmada, data_movimento")
          .eq("sociedade_id", sociedadeId!),
        supabase
          .from("solicitacoes_pagamento")
          .select("id, status, valor, data_pagamento")
          .eq("sociedade_id", sociedadeId!),
      ]);

      if (movRes.error) throw movRes.error;
      if (solicRes.error) throw solicRes.error;

      const saldo = (movRes.data ?? []).reduce((acc, m) => {
        if (!m.confirmada) return acc;
        const v = Number(m.valor) || 0;
        if (m.tipo === "entrada") return acc + v;
        if (m.tipo === "saida") return acc - v;
        return acc + v; // ajuste
      }, 0);

      const contribuicoesMes = (movRes.data ?? [])
        .filter((m) => m.confirmada && m.tipo === "entrada" && m.data_movimento >= inicio)
        .reduce((acc, m) => acc + (Number(m.valor) || 0), 0);

      const pagamentosMes = (solicRes.data ?? [])
        .filter((s) => s.status === "paga" && s.data_pagamento && s.data_pagamento >= inicio)
        .reduce((acc, s) => acc + (Number(s.valor) || 0), 0);

      const solicitacoesPendentes = (solicRes.data ?? []).filter(
        (s) => s.status === "rascunho",
      ).length;

      return {
        saldoAtual: saldo,
        contribuicoesMes,
        pagamentosMes,
        solicitacoesPendentes,
      };
    },
  });
}
