import { Building2, Wallet } from "lucide-react";
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

export function MobileCofrinhos({ saldos }: Props) {
  const { sociedadeSelecionadaId, setSociedadeSelecionadaId } = useSociedadeOperacional();
  const total = saldos.reduce((soma, item) => soma + item.saldoAtual, 0);

  return (
    <section className="mt-4">
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <h3 className="text-base font-bold text-foreground">Cofrinhos</h3>
          <p className="text-xs text-muted-foreground">Deslize para ver todas as sociedades.</p>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">{saldos.length} sociedades</span>
      </div>

      <div className="mobile-cofrinhos-scroll">
        <button
          type="button"
          onClick={() => setSociedadeSelecionadaId(null)}
          className={cn("mobile-cofrinho-item", !sociedadeSelecionadaId && "is-active")}
        >
          <span className="mobile-cofrinho-circle">
            <Wallet className="h-6 w-6" />
          </span>
          <span className="mobile-cofrinho-name">Geral</span>
          <span className="mobile-cofrinho-value">{formatarMoeda(total)}</span>
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
              >
                <span className="mobile-cofrinho-circle">
                  <span className="text-sm font-bold">{iniciais(item.nome)}</span>
                  <Building2 className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-card p-0.5 text-primary" />
                </span>
                <span className="mobile-cofrinho-name">{item.nome}</span>
                <span className="mobile-cofrinho-value">{formatarMoeda(item.saldoAtual)}</span>
              </button>
            );
          })}
      </div>
    </section>
  );
}
