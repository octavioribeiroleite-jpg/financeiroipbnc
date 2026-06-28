import { formatarMoeda } from "@/lib/format";
import { cn } from "@/lib/utils";

function Resumo({ titulo, valor, positivo }: { titulo: string; valor: number; positivo: boolean }) {
  return (
    <div className="rounded-2xl border bg-card p-3 shadow-card">
      <p className="text-[11px] font-semibold leading-tight text-muted-foreground">{titulo}</p>
      <p className={cn("financial-number mt-3 whitespace-nowrap text-[1.05rem] font-bold tracking-tight", positivo ? "text-emerald-700" : "text-rose-700")}>{formatarMoeda(valor)}</p>
    </div>
  );
}

export function MobileSummaryCards({ entradas, saidas, resultado }: { entradas: number; saidas: number; resultado: number }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      <Resumo titulo="Entradas do mês" valor={entradas} positivo />
      <Resumo titulo="Saídas do mês" valor={saidas} positivo={false} />
      <Resumo titulo="Resultado" valor={resultado} positivo={resultado >= 0} />
    </div>
  );
}
