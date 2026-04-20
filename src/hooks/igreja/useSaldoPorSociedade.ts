import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SaldoSociedade {
  sociedadeId: string;
  nome: string;
  tipo: string;
  saldoAtual: number;
  entradasMes: number;
  saidasMes: number;
}

function fimMes(inicio: string): string {
  const d = new Date(inicio + "T00:00:00");
  const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, "0")}-${String(
    fim.getDate(),
  ).padStart(2, "0")}`;
}

export function useSaldoPorSociedade(inicioMes: string) {
  const fim = fimMes(inicioMes);
  return useQuery({
    queryKey: ["igreja", "saldo-sociedades", inicioMes] as const,
    queryFn: async (): Promise<SaldoSociedade[]> => {
      const [socRes, movRes] = await Promise.all([
        supabase.from("sociedades").select("id, nome, tipo, status").order("nome"),
        supabase
          .from("movimentacoes_sociedade")
          .select("sociedade_id, tipo, valor, confirmada, data_movimento"),
      ]);
      if (socRes.error) throw socRes.error;
      if (movRes.error) throw movRes.error;

      const movs = movRes.data ?? [];
      return (socRes.data ?? []).map((s) => {
        let saldo = 0;
        let entradas = 0;
        let saidas = 0;
        for (const m of movs) {
          if (m.sociedade_id !== s.id || !m.confirmada) continue;
          const v = Number(m.valor) || 0;
          if (m.tipo === "entrada") saldo += v;
          else if (m.tipo === "saida") saldo -= v;
          else saldo += v;
          if (m.data_movimento >= inicioMes && m.data_movimento <= fim) {
            if (m.tipo === "entrada") entradas += v;
            else if (m.tipo === "saida") saidas += v;
          }
        }
        return {
          sociedadeId: s.id,
          nome: s.nome,
          tipo: s.tipo,
          saldoAtual: saldo,
          entradasMes: entradas,
          saidasMes: saidas,
        };
      });
    },
  });
}
