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
      const [movRes, contribPendRes, solicRes] = await Promise.all([
        supabase.from("movimentacoes_sociedade").select("tipo, valor, confirmada, data_movimento"),
        supabase.from("contribuicoes").select("id, status_conferencia"),
        supabase.from("solicitacoes_pagamento").select("id, status, valor, data_pagamento"),
      ]);

      if (movRes.error) throw movRes.error;
      if (contribPendRes.error) throw contribPendRes.error;
      if (solicRes.error) throw solicRes.error;

      const movimentosConfirmados = (movRes.data ?? []).filter((m) => m.confirmada);

      const saldoConsolidado = movimentosConfirmados.reduce((acc, m) => {
        if (!m.confirmada) return acc;
        const v = Number(m.valor) || 0;
        if (m.tipo === "entrada") return acc + v;
        if (m.tipo === "saida") return acc - v;
        return acc + v;
      }, 0);

      const movimentosMes = movimentosConfirmados.filter(
        (m) => m.data_movimento >= inicioMes && m.data_movimento <= fim,
      );

      const entradasMes = movimentosMes
        .filter((m) => m.tipo === "entrada")
        .reduce((acc, m) => acc + (Number(m.valor) || 0), 0);

      const saidasMes = movimentosMes
        .filter((m) => m.tipo === "saida")
        .reduce((acc, m) => acc + (Number(m.valor) || 0), 0);

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
