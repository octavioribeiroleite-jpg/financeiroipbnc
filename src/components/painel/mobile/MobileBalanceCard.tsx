import { Link } from "react-router-dom";
import { BarChart3, FileText, HandCoins, Receipt, Wallet } from "lucide-react";
import { formatarMoeda } from "@/lib/format";

function Acao({ para, titulo, icone: Icone }: { para: string; titulo: string; icone: typeof HandCoins }) {
  return (
    <Link to={para} className="flex flex-col items-center gap-2 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-primary"><Icone className="h-6 w-6" /></span>
      <span className="text-xs font-semibold">{titulo}</span>
    </Link>
  );
}

export function MobileBalanceCard({ saldo }: { saldo: number }) {
  return (
    <div className="rounded-[1.5rem] border bg-card p-5 shadow-elevated">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Saldo total</p>
          <p className="financial-number mt-2 text-[2rem] font-bold tracking-[-0.045em]">{formatarMoeda(saldo)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Saldo atual do escopo selecionado</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary"><Wallet className="h-5 w-5" /></span>
      </div>
      <div className="my-5 h-px bg-border" />
      <div className="grid grid-cols-4 gap-2">
        <Acao para="/sociedade/contribuicoes" titulo="Entrada" icone={HandCoins} />
        <Acao para="/sociedade/solicitacoes" titulo="Pagamento" icone={FileText} />
        <Acao para="/sociedade/extrato" titulo="Extrato" icone={Receipt} />
        <Acao para="/igreja/relatorios" titulo="Relatório" icone={BarChart3} />
      </div>
    </div>
  );
}
