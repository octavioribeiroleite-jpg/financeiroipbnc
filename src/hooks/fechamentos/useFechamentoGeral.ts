import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Movimento = Database["public"]["Tables"]["movimentacoes_sociedade"]["Row"];
type Sociedade = Database["public"]["Tables"]["sociedades"]["Row"];

export interface MovimentacaoGeral extends Movimento {
  sociedade_nome: string;
  sociedade_tipo: string;
}

export interface ResumoSociedadeMes {
  sociedadeId: string;
  nome: string;
  tipo: string;
  saldoInicial: number;
  entradas: number;
  saidas: number;
  ajustes: number;
  saldoFinal: number;
  participacao: number;
  movimentosMes: number;
}

export interface FechamentoGeralMes {
  ano: number;
  mes: number;
  inicio: string;
  fim: string;
  resumo: {
    saldoInicial: number;
    entradas: number;
    saidas: number;
    ajustes: number;
    saldoFinal: number;
    pendentes: number;
    quantidadeMovimentos: number;
  };
  sociedades: ResumoSociedadeMes[];
  movimentacoes: MovimentacaoGeral[];
}

function inicioMesIso(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-01`;
}

function fimMesIso(ano: number, mes: number): string {
  const fim = new Date(ano, mes, 0);
  return `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, "0")}-${String(fim.getDate()).padStart(2, "0")}`;
}

function valorImpacto(mov: Pick<Movimento, "tipo" | "valor">): number {
  const valor = Number(mov.valor) || 0;
  return mov.tipo === "saida" ? -valor : valor;
}

function somar(movs: Movimento[], tipo: "entrada" | "saida"): number {
  return movs
    .filter((m) => m.confirmada && m.tipo === tipo)
    .reduce((acc, m) => acc + (Number(m.valor) || 0), 0);
}

export function useFechamentoGeral(mesReferencia: string) {
  return useQuery({
    queryKey: ["fechamentos", "geral", mesReferencia] as const,
    queryFn: async (): Promise<FechamentoGeralMes> => {
      const [anoStr, mesStr] = mesReferencia.split("-");
      const ano = Number(anoStr);
      const mes = Number(mesStr);
      const inicio = inicioMesIso(ano, mes);
      const fim = fimMesIso(ano, mes);

      const [sociedadesRes, movimentosRes] = await Promise.all([
        supabase.from("sociedades").select("*").order("nome", { ascending: true }),
        supabase
          .from("movimentacoes_sociedade")
          .select("*")
          .lte("data_movimento", fim)
          .order("data_movimento", { ascending: true }),
      ]);

      if (sociedadesRes.error) throw sociedadesRes.error;
      if (movimentosRes.error) throw movimentosRes.error;

      const sociedades = (sociedadesRes.data ?? []) as Sociedade[];
      const movimentos = (movimentosRes.data ?? []) as Movimento[];
      const sociedadePorId = new Map(sociedades.map((s) => [s.id, s]));

      const movimentosDoMes = movimentos
        .filter((m) => m.data_movimento >= inicio && m.data_movimento <= fim)
        .map((m) => {
          const sociedade = sociedadePorId.get(m.sociedade_id);
          return {
            ...m,
            sociedade_nome: sociedade?.nome ?? "Sociedade não identificada",
            sociedade_tipo: sociedade?.tipo ?? "",
          };
        });

      const sociedadesComMovimento = new Set(movimentos.map((m) => m.sociedade_id));
      const sociedadesBase = sociedades.filter((s) => s.status === "ativa" || sociedadesComMovimento.has(s.id));

      const resumos = sociedadesBase.map((sociedade) => {
        const movimentosSociedade = movimentos.filter((m) => m.sociedade_id === sociedade.id);
        const anteriores = movimentosSociedade.filter((m) => m.confirmada && m.data_movimento < inicio);
        const mesAtual = movimentosSociedade.filter((m) => m.data_movimento >= inicio && m.data_movimento <= fim);
        const confirmadosMes = mesAtual.filter((m) => m.confirmada);
        const saldoInicial = anteriores.reduce((acc, m) => acc + valorImpacto(m), 0);
        const entradas = somar(mesAtual, "entrada");
        const saidas = somar(mesAtual, "saida");
        const ajustes = confirmadosMes
          .filter((m) => m.tipo === "ajuste")
          .reduce((acc, m) => acc + valorImpacto(m), 0);
        const saldoFinal = saldoInicial + entradas - saidas + ajustes;

        return {
          sociedadeId: sociedade.id,
          nome: sociedade.nome,
          tipo: sociedade.tipo,
          saldoInicial,
          entradas,
          saidas,
          ajustes,
          saldoFinal,
          participacao: 0,
          movimentosMes: mesAtual.length,
        };
      });

      const saldoInicial = resumos.reduce((acc, s) => acc + s.saldoInicial, 0);
      const entradas = resumos.reduce((acc, s) => acc + s.entradas, 0);
      const saidas = resumos.reduce((acc, s) => acc + s.saidas, 0);
      const ajustes = resumos.reduce((acc, s) => acc + s.ajustes, 0);
      const saldoFinal = resumos.reduce((acc, s) => acc + s.saldoFinal, 0);
      const pendentes = movimentosDoMes.filter((m) => !m.confirmada).length;

      const sociedadesComParticipacao = resumos.map((s) => ({
        ...s,
        participacao: saldoFinal > 0 ? (s.saldoFinal / saldoFinal) * 100 : 0,
      }));

      return {
        ano,
        mes,
        inicio,
        fim,
        resumo: {
          saldoInicial,
          entradas,
          saidas,
          ajustes,
          saldoFinal,
          pendentes,
          quantidadeMovimentos: movimentosDoMes.length,
        },
        sociedades: sociedadesComParticipacao,
        movimentacoes: movimentosDoMes,
      };
    },
  });
}
