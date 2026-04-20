import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResumoIgreja {
  saldoConsolidado: number;
  entradasMes: number;
  saidasMes: number;
  solicitacoesPendentes: number;
  contribuicoesPendentes: number;
  divergencias: number;
}

function fimMes(inicio: string): string {
  const d = new Date(inicio + "T00:00:00");
  const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, "0")}-${String(
    fim.getDate(),
  ).padStart(2, "0")}`;
}

export function useResumoIgreja(inicioMes: string) {
  const fim = fimMes(inicioMes);
  return useQuery({
    queryKey: ["igreja", "resumo", inicioMes] as const,
    queryFn: async (): Promise<ResumoIgreja> => {
      const [movRes, contribMesRes, contribPendRes, solicRes] = await Promise.all([
        supabase.from("movimentacoes_sociedade").select("tipo, valor, confirmada, data_movimento"),
        supabase
          .from("contribuicoes")
          .select("valor, data_pagamento")
          .gte("data_pagamento", inicioMes)
          .lte("data_pagamento", fim),
        supabase.from("contribuicoes").select("id, status_conferencia"),
        supabase.from("solicitacoes_pagamento").select("id, status, valor, data_pagamento"),
      ]);

      if (movRes.error) throw movRes.error;
      if (contribMesRes.error) throw contribMesRes.error;
      if (contribPendRes.error) throw contribPendRes.error;
      if (solicRes.error) throw solicRes.error;

      const saldoConsolidado = (movRes.data ?? []).reduce((acc, m) => {
        if (!m.confirmada) return acc;
        const v = Number(m.valor) || 0;
        if (m.tipo === "entrada") return acc + v;
        if (m.tipo === "saida") return acc - v;
        return acc + v;
      }, 0);

      const entradasMes = (contribMesRes.data ?? []).reduce(
        (acc, c) => acc + (Number(c.valor) || 0),
        0,
      );

      const saidasMes = (solicRes.data ?? [])
        .filter(
          (s) =>
            s.status === "paga" &&
            s.data_pagamento &&
            s.data_pagamento >= inicioMes &&
            s.data_pagamento <= fim,
        )
        .reduce((acc, s) => acc + (Number(s.valor) || 0), 0);

      const solicitacoesPendentes = (solicRes.data ?? []).filter((s) =>
        ["enviada", "em_analise"].includes(s.status as string),
      ).length;

      const contribuicoesPendentes = (contribPendRes.data ?? []).filter(
        (c) => c.status_conferencia === "pendente",
      ).length;

      const divergencias = (contribPendRes.data ?? []).filter(
        (c) => c.status_conferencia === "divergente",
      ).length;

      return {
        saldoConsolidado,
        entradasMes,
        saidasMes,
        solicitacoesPendentes,
        contribuicoesPendentes,
        divergencias,
      };
    },
  });
}
