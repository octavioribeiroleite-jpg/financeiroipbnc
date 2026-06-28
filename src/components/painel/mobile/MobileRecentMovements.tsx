import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import { useSociedadeOperacional } from "@/contexts/SociedadeOperacionalContext";
import { useMovimentacoesRecentes } from "@/hooks/painel/useMovimentacoesRecentes";
import { formatarMoeda } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MobileRecentMovements() {
  const { sociedadeSelecionadaId } = useSociedadeOperacional();
  const { data: movimentacoes = [], isLoading } = useMovimentacoesRecentes(sociedadeSelecionadaId);

  return (
    <div className="mt-4 rounded-[1.35rem] border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold">Movimentações recentes</h3>
        <Link to="/sociedade/extrato" className="flex items-center text-xs font-semibold text-brand-gold-600">Ver todas <ChevronRight className="h-4 w-4" /></Link>
      </div>
      <div className="mt-3 divide-y">
        {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && movimentacoes.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma movimentação recente.</p>}
        {movimentacoes.slice(0, 5).map((movimento) => {
          const entrada = movimento.tipo === "entrada";
          return (
            <div key={movimento.id} className="flex items-center gap-3 py-3">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", entrada ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>{entrada ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{movimento.titulo}</p><p className="text-xs text-muted-foreground">{new Date(movimento.data).toLocaleDateString("pt-BR")}</p></div>
              <p className={cn("financial-number text-sm font-bold", entrada ? "text-emerald-700" : "text-rose-700")}>{entrada ? "+ " : "- "}{formatarMoeda(movimento.valor)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
