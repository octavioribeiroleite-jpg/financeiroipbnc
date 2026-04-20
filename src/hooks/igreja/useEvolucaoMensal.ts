import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PontoEvolucao {
  mes: string; // "YYYY-MM"
  rotulo: string; // "Jan/25"
  entradas: number;
  saidas: number;
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function useEvolucaoMensal(meses: number = 6) {
  return useQuery({
    queryKey: ["igreja", "evolucao", meses] as const,
    queryFn: async (): Promise<PontoEvolucao[]> => {
      const hoje = new Date();
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - (meses - 1), 1);
      const inicioIso = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, "0")}-01`;

      const { data, error } = await supabase
        .from("movimentacoes_sociedade")
        .select("tipo, valor, confirmada, data_movimento")
        .gte("data_movimento", inicioIso);
      if (error) throw error;

      const buckets = new Map<string, PontoEvolucao>();
      for (let i = 0; i < meses; i++) {
        const d = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        buckets.set(key, {
          mes: key,
          rotulo: `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
          entradas: 0,
          saidas: 0,
        });
      }

      for (const m of data ?? []) {
        if (!m.confirmada) continue;
        const key = m.data_movimento.slice(0, 7);
        const b = buckets.get(key);
        if (!b) continue;
        const v = Number(m.valor) || 0;
        if (m.tipo === "entrada") b.entradas += v;
        else if (m.tipo === "saida") b.saidas += v;
      }
      return Array.from(buckets.values());
    },
  });
}
