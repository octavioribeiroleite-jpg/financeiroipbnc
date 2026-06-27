import type { Database } from "@/integrations/supabase/types";

type StatusSolicitacao = Database["public"]["Enums"]["status_solicitacao"];

export interface SolicitacaoPagamentoResumo {
  status: StatusSolicitacao;
  valor: number;
  vencimento: string;
  sociedade_id: string;
}

export type AbaPagamento = "pendentes" | "em_analise" | "aprovadas" | "pagas" | "todas";

const STATUS_ATIVOS: StatusSolicitacao[] = ["enviada", "em_analise", "aprovada"];

export function hojeISO(referencia = new Date()): string {
  const ano = referencia.getFullYear();
  const mes = String(referencia.getMonth() + 1).padStart(2, "0");
  const dia = String(referencia.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function adicionarDiasISO(dataISO: string, dias: number): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setDate(data.getDate() + dias);
  return hojeISO(data);
}

export function pertenceAbaPagamento(status: StatusSolicitacao, aba: AbaPagamento): boolean {
  if (aba === "todas") return true;
  if (aba === "pendentes") return status === "enviada" || status === "em_analise";
  if (aba === "em_analise") return status === "em_analise";
  if (aba === "aprovadas") return status === "aprovada";
  return status === "paga";
}

export function calcularResumoPagamentos(
  solicitacoes: SolicitacaoPagamentoResumo[],
  dataHoje = hojeISO(),
) {
  const fimSemana = adicionarDiasISO(dataHoje, 7);
  const pendentes = solicitacoes.filter((s) => s.status === "enviada" || s.status === "em_analise");
  const aprovadas = solicitacoes.filter((s) => s.status === "aprovada");
  const ativos = solicitacoes.filter((s) => STATUS_ATIVOS.includes(s.status));

  return {
    qtdPendentes: pendentes.length,
    qtdAprovadas: aprovadas.length,
    valorAprovadas: aprovadas.reduce((total, s) => total + Number(s.valor || 0), 0),
    vencendoSemana: ativos.filter((s) => s.vencimento >= dataHoje && s.vencimento <= fimSemana).length,
    vencidas: ativos.filter((s) => s.vencimento < dataHoje).length,
    porAba: {
      pendentes: pendentes.length,
      em_analise: solicitacoes.filter((s) => s.status === "em_analise").length,
      aprovadas: aprovadas.length,
      pagas: solicitacoes.filter((s) => s.status === "paga").length,
      todas: solicitacoes.length,
    },
  };
}
