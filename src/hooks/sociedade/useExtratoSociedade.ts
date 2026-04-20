import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Movimentacao = Database["public"]["Tables"]["movimentacoes_sociedade"]["Row"];

export interface LinhaExtrato extends Movimentacao {
  saldoAcumulado: number;
}

export interface ExtratoMes {
  inicioISO: string; // YYYY-MM-01
  fimISO: string; // YYYY-MM-último dia
  saldoInicial: number;
  totalEntradas: number;
  totalSaidas: number;
  saldoFinal: number;
  consolidado: boolean;
  linhas: LinhaExtrato[];
}

function rangeMes(refIso: string): { inicio: string; fim: string } {
  // refIso = "YYYY-MM-01"
  const [y, m] = refIso.split("-").map(Number);
  const inicio = `${y}-${String(m).padStart(2, "0")}-01`;
  const ultimoDia = new Date(y, m, 0).getDate();
  const fim = `${y}-${String(m).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
  return { inicio, fim };
}

export function useExtratoSociedade(sociedadeId: string | null, mesIso: string) {
  return useQuery({
    queryKey: ["extrato-sociedade", sociedadeId, mesIso] as const,
    enabled: !!sociedadeId && !!mesIso,
    queryFn: async (): Promise<ExtratoMes> => {
      const { inicio, fim } = rangeMes(mesIso);

      const [historicoRes, mesRes, consolidadoRes] = await Promise.all([
        // Movimentações anteriores ao mês — para calcular saldo inicial
        supabase
          .from("movimentacoes_sociedade")
          .select("tipo, valor, confirmada")
          .eq("sociedade_id", sociedadeId!)
          .lt("data_movimento", inicio),
        // Movimentações do mês
        supabase
          .from("movimentacoes_sociedade")
          .select("*")
          .eq("sociedade_id", sociedadeId!)
          .gte("data_movimento", inicio)
          .lte("data_movimento", fim)
          .order("data_movimento", { ascending: true })
          .order("data_criacao", { ascending: true }),
        // Mês consolidado?
        supabase.rpc("mes_consolidado", { _sociedade_id: sociedadeId!, _data: inicio }),
      ]);

      if (historicoRes.error) throw historicoRes.error;
      if (mesRes.error) throw mesRes.error;
      if (consolidadoRes.error) throw consolidadoRes.error;

      const saldoInicial = (historicoRes.data ?? []).reduce((acc, m) => {
        if (!m.confirmada) return acc;
        const v = Number(m.valor) || 0;
        if (m.tipo === "entrada") return acc + v;
        if (m.tipo === "saida") return acc - v;
        return acc + v; // ajuste
      }, 0);

      let saldo = saldoInicial;
      let totalEntradas = 0;
      let totalSaidas = 0;

      const linhas: LinhaExtrato[] = (mesRes.data ?? []).map((m) => {
        const v = Number(m.valor) || 0;
        if (m.confirmada) {
          if (m.tipo === "entrada") {
            saldo += v;
            totalEntradas += v;
          } else if (m.tipo === "saida") {
            saldo -= v;
            totalSaidas += v;
          } else {
            // ajuste contabiliza no saldo, sem entrar nos totais
            saldo += v;
          }
        }
        return { ...(m as Movimentacao), saldoAcumulado: saldo };
      });

      return {
        inicioISO: inicio,
        fimISO: fim,
        saldoInicial,
        totalEntradas,
        totalSaidas,
        saldoFinal: saldo,
        consolidado: !!consolidadoRes.data,
        linhas,
      };
    },
  });
}
