import { describe, expect, it } from "vitest";
import { adicionarDiasISO, calcularResumoPagamentos, pertenceAbaPagamento } from "./pagamentos";

const base = [
  { status: "enviada" as const, valor: 80, vencimento: "2026-06-27", sociedade_id: "1" },
  { status: "em_analise" as const, valor: 45, vencimento: "2026-06-28", sociedade_id: "1" },
  { status: "aprovada" as const, valor: 100, vencimento: "2026-07-04", sociedade_id: "1" },
  { status: "aprovada" as const, valor: 25, vencimento: "2026-06-26", sociedade_id: "1" },
  { status: "paga" as const, valor: 70, vencimento: "2026-06-20", sociedade_id: "1" },
];

describe("regras da fila de pagamentos", () => {
  it("inclui o dia atual e o sétimo dia no indicador semanal", () => {
    const resumo = calcularResumoPagamentos(base, "2026-06-27");

    expect(resumo.vencendoSemana).toBe(3);
    expect(resumo.vencidas).toBe(1);
  });

  it("soma somente solicitações aprovadas ainda não pagas", () => {
    const resumo = calcularResumoPagamentos(base, "2026-06-27");

    expect(resumo.qtdAprovadas).toBe(2);
    expect(resumo.valorAprovadas).toBe(125);
  });

  it("trata pendentes como enviadas ou em análise", () => {
    expect(pertenceAbaPagamento("enviada", "pendentes")).toBe(true);
    expect(pertenceAbaPagamento("em_analise", "pendentes")).toBe(true);
    expect(pertenceAbaPagamento("aprovada", "pendentes")).toBe(false);
  });

  it("avança datas sem depender de UTC", () => {
    expect(adicionarDiasISO("2026-12-29", 7)).toBe("2027-01-05");
  });
});
