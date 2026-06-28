import { Wallet } from "lucide-react";
import type { SaldoSociedade } from "@/hooks/igreja/useSaldoPorSociedade";
import { useSociedadeOperacional } from "@/contexts/SociedadeOperacionalContext";
import { formatarMoeda } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  saldos: SaldoSociedade[];
}

function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

function formatarSaldoCompacto(valor: number) {
  const absoluto = Math.abs(valor);
  const sinal = valor < 0 ? "-" : "";

  if (absoluto >= 1_000_000) {
    return `${sinal}R$ ${(absoluto / 1_000_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} mi`;
  }

  if (absoluto >= 10_000) {
    return `${sinal}R$ ${(absoluto / 1_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} mil`;
  }

  return formatarMoeda(valor);
}

export function MobileCofrinhos({ saldos }: Props) {
  const { sociedadeSelecionadaId, setSociedadeSelecionadaId } = useSociedadeOperacional();
  const total = saldos.reduce((soma, item) => soma + item.saldoAtual, 0);

  return (
    <section className="mt-5">
      <div className="mb-3 flex items-end justify-between px-1">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-foreground">Cofrinhos</h3>
          <p className="text-xs text-muted-foreground">Deslize para consultar cada sociedade.</p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
          {saldos.length} sociedades
        </span>
      </div>

      <div className="mobile-cofrinhos-scroll">
        <button
          type="button"
          onClick={() => setSociedadeSelecionadaId(null)}
          className={cn("mobile-cofrinho-item", !sociedadeSelecionadaId && "is-active")}
          aria-label={`Ver saldo geral: ${formatarMoeda(total)}`}
        >
          <span className="mobile-cofrinho-name">Geral</span>
          <span className="mobile-cofrinho-circle">
            <span className="mobile-cofrinho-mark"><Wallet className="h-4 w-4" /></span>
            <span className="mobile-cofrinho-label">Saldo</span>
            <span className="mobile-cofrinho-value">{formatarSaldoCompacto(total)}</span>
          </span>
        </button>

        {saldos
          .slice()
          .sort((a, b) => b.saldoAtual - a.saldoAtual)
          .map((item) => {
            const ativo = sociedadeSelecionadaId === item.sociedadeId;
            return (
              <button
                key={item.sociedadeId}
                type="button"
                onClick={() => setSociedadeSelecionadaId(item.sociedadeId)}
                className={cn("mobile-cofrinho-item", ativo && "is-active")}
                aria-label={`Ver ${item.nome}: ${formatarMoeda(item.saldoAtual)}`}
              >
                <span className="mobile-cofrinho-name" title={item.nome}>{item.nome}</span>
                <span className="mobile-cofrinho-circle">
                  <span className="mobile-cofrinho-mark">{iniciais(item.nome)}</span>
                  <span className="mobile-cofrinho-label">Saldo</span>
                  <span className="mobile-cofrinho-value">{formatarSaldoCompacto(item.saldoAtual)}</span>
                </span>
              </button>
            );
          })}
      </div>
    </section>
  );
}
