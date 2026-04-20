import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Fechamento = Database["public"]["Tables"]["fechamentos_mensais"]["Row"];
export type StatusFechamento = Database["public"]["Enums"]["status_fechamento"];

interface TotaisMes {
  total_entradas: number;
  total_saidas: number;
}

function fimMesIso(ano: number, mes: number): string {
  const fim = new Date(ano, mes, 0); // último dia do mês (mes 1-12)
  return `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, "0")}-${String(fim.getDate()).padStart(2, "0")}`;
}
function inicioMesIso(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-01`;
}

/** Calcula totais de entradas/saídas confirmadas de uma sociedade no mês. */
async function calcularTotaisMes(
  sociedadeId: string,
  ano: number,
  mes: number,
): Promise<TotaisMes> {
  const inicio = inicioMesIso(ano, mes);
  const fim = fimMesIso(ano, mes);
  const { data, error } = await supabase
    .from("movimentacoes_sociedade")
    .select("tipo, valor, confirmada, data_movimento")
    .eq("sociedade_id", sociedadeId)
    .gte("data_movimento", inicio)
    .lte("data_movimento", fim);
  if (error) throw error;
  let entradas = 0;
  let saidas = 0;
  for (const m of data ?? []) {
    if (!m.confirmada) continue;
    const v = Number(m.valor) || 0;
    if (m.tipo === "entrada") entradas += v;
    else if (m.tipo === "saida") saidas += v;
    else entradas += v; // ajuste positivo
  }
  return { total_entradas: entradas, total_saidas: saidas };
}

/** Saldo final do mês anterior (consolidado, conferido ou aberto — usa o último). */
async function obterSaldoInicial(
  sociedadeId: string,
  ano: number,
  mes: number,
): Promise<number> {
  const anoAnt = mes === 1 ? ano - 1 : ano;
  const mesAnt = mes === 1 ? 12 : mes - 1;
  const { data } = await supabase
    .from("fechamentos_mensais")
    .select("saldo_final")
    .eq("sociedade_id", sociedadeId)
    .eq("ano", anoAnt)
    .eq("mes", mesAnt)
    .maybeSingle();
  return data ? Number(data.saldo_final) || 0 : 0;
}

// ---------- Listagens ----------

export function useFechamentosSociedade(sociedadeId: string | null) {
  return useQuery({
    queryKey: ["fechamentos", "sociedade", sociedadeId] as const,
    enabled: !!sociedadeId,
    queryFn: async (): Promise<Fechamento[]> => {
      const { data, error } = await supabase
        .from("fechamentos_mensais")
        .select("*")
        .eq("sociedade_id", sociedadeId!)
        .order("ano", { ascending: false })
        .order("mes", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFechamentosCentral() {
  return useQuery({
    queryKey: ["fechamentos", "central"] as const,
    queryFn: async (): Promise<Fechamento[]> => {
      const { data, error } = await supabase
        .from("fechamentos_mensais")
        .select("*")
        .in("status", ["enviado", "conferido"])
        .order("ano", { ascending: false })
        .order("mes", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFechamentosIgreja(ano: number, mes: number) {
  return useQuery({
    queryKey: ["fechamentos", "igreja", ano, mes] as const,
    queryFn: async (): Promise<Fechamento[]> => {
      const { data, error } = await supabase
        .from("fechamentos_mensais")
        .select("*")
        .eq("ano", ano)
        .eq("mes", mes);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFechamento(id: string | null) {
  return useQuery({
    queryKey: ["fechamentos", "item", id] as const,
    enabled: !!id,
    queryFn: async (): Promise<Fechamento | null> => {
      const { data, error } = await supabase
        .from("fechamentos_mensais")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useMovimentacoesMes(
  sociedadeId: string | null,
  ano: number | null,
  mes: number | null,
) {
  return useQuery({
    queryKey: ["fechamentos", "movs", sociedadeId, ano, mes] as const,
    enabled: !!sociedadeId && !!ano && !!mes,
    queryFn: async () => {
      const inicio = inicioMesIso(ano!, mes!);
      const fim = fimMesIso(ano!, mes!);
      const { data, error } = await supabase
        .from("movimentacoes_sociedade")
        .select("id, tipo, origem, valor, data_movimento, observacao, confirmada")
        .eq("sociedade_id", sociedadeId!)
        .gte("data_movimento", inicio)
        .lte("data_movimento", fim)
        .order("data_movimento", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ---------- Mutações ----------

interface NovoInput {
  sociedadeId: string;
  ano: number;
  mes: number;
  observacao?: string | null;
}

export function useCriarFechamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NovoInput) => {
      const totais = await calcularTotaisMes(input.sociedadeId, input.ano, input.mes);
      const saldoInicial = await obterSaldoInicial(input.sociedadeId, input.ano, input.mes);
      const { data, error } = await supabase
        .from("fechamentos_mensais")
        .insert({
          sociedade_id: input.sociedadeId,
          ano: input.ano,
          mes: input.mes,
          saldo_inicial: saldoInicial,
          total_entradas: totais.total_entradas,
          total_saidas: totais.total_saidas,
          saldo_final: 0, // recalculado por trigger
          status: "aberto",
          observacao: input.observacao ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fechamentos"] });
      toast.success("Fechamento criado.");
    },
    onError: (e: unknown) => {
      const msg = (e as { message?: string })?.message ?? "Erro ao criar fechamento.";
      if (msg.includes("ux_fechamentos_soc_ano_mes") || msg.includes("duplicate")) {
        toast.error("Já existe um fechamento para esse mês.");
      } else {
        toast.error(msg);
      }
    },
  });
}

export function useRecalcularFechamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: Fechamento) => {
      const totais = await calcularTotaisMes(f.sociedade_id, f.ano, f.mes);
      const saldoInicial = await obterSaldoInicial(f.sociedade_id, f.ano, f.mes);
      const { data, error } = await supabase
        .from("fechamentos_mensais")
        .update({
          saldo_inicial: saldoInicial,
          total_entradas: totais.total_entradas,
          total_saidas: totais.total_saidas,
        })
        .eq("id", f.id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fechamentos"] });
      toast.success("Fechamento recalculado.");
    },
    onError: (e: unknown) => toast.error((e as { message?: string })?.message ?? "Erro."),
  });
}

export function useEnviarFechamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: Fechamento) => {
      const userRes = await supabase.auth.getUser();
      const uid = userRes.data.user?.id ?? null;
      const { error } = await supabase
        .from("fechamentos_mensais")
        .update({
          status: "enviado",
          enviado_por: uid,
          data_envio: new Date().toISOString(),
        })
        .eq("id", f.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fechamentos"] });
      toast.success("Fechamento enviado para conferência.");
    },
    onError: (e: unknown) => toast.error((e as { message?: string })?.message ?? "Erro."),
  });
}

export function useConferirFechamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: Fechamento) => {
      const userRes = await supabase.auth.getUser();
      const uid = userRes.data.user?.id ?? null;
      const { error } = await supabase
        .from("fechamentos_mensais")
        .update({
          status: "conferido",
          conferido_por: uid,
          data_conferencia: new Date().toISOString(),
        })
        .eq("id", f.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fechamentos"] });
      toast.success("Fechamento conferido.");
    },
    onError: (e: unknown) => toast.error((e as { message?: string })?.message ?? "Erro."),
  });
}

export function useDevolverFechamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { f: Fechamento; motivo: string }) => {
      const obs = `[Devolvido pela Central] ${input.motivo}${
        input.f.observacao ? `\n---\n${input.f.observacao}` : ""
      }`;
      const { error } = await supabase
        .from("fechamentos_mensais")
        .update({
          status: "aberto",
          observacao: obs,
        })
        .eq("id", input.f.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fechamentos"] });
      toast.success("Fechamento devolvido à sociedade.");
    },
    onError: (e: unknown) => toast.error((e as { message?: string })?.message ?? "Erro."),
  });
}

export function useExcluirFechamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fechamentos_mensais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fechamentos"] });
      toast.success("Fechamento excluído.");
    },
    onError: (e: unknown) => toast.error((e as { message?: string })?.message ?? "Erro."),
  });
}

export function useConsolidarMes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { ano: number; mes: number }) => {
      const { error } = await supabase
        .from("fechamentos_mensais")
        .update({ status: "consolidado" })
        .eq("ano", input.ano)
        .eq("mes", input.mes)
        .eq("status", "conferido");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fechamentos"] });
      toast.success("Mês consolidado.");
    },
    onError: (e: unknown) => toast.error((e as { message?: string })?.message ?? "Erro."),
  });
}

export function useReabrirFechamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; motivo: string }) => {
      const { data, error } = await supabase.rpc("reabrir_fechamento_consolidado", {
        _fechamento_id: input.id,
        _motivo: input.motivo,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fechamentos"] });
      qc.invalidateQueries({ queryKey: ["mes-consolidado"] });
      toast.success("Fechamento reaberto. O mês voltou para 'conferido'.");
    },
    onError: (e: unknown) => toast.error((e as { message?: string })?.message ?? "Erro."),
  });
}

