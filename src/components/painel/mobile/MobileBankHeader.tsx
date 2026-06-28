import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useSociedadeOperacional } from "@/contexts/SociedadeOperacionalContext";

interface Props {
  periodo: string;
  setPeriodo: (periodo: string) => void;
  periodos: Array<{ valor: string; rotulo: string }>;
}

export function MobileBankHeader({ periodo, setPeriodo, periodos }: Props) {
  const { perfil } = useAuth();
  const { sociedadeSelecionada } = useSociedadeOperacional();
  const nome = perfil?.nome?.trim().split(/\s+/)[0] || "Octávio";

  return (
    <section className="bg-brand-navy-900 px-5 pb-28 pt-5 text-white">
      <p className="text-sm text-white/70">Olá, {nome}</p>
      <h2 className="mt-1 text-2xl font-bold text-white">Sua tesouraria</h2>
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{sociedadeSelecionada?.nome ?? "Geral da conta"}</p>
          <p className="truncate text-[11px] text-white/65">{sociedadeSelecionada?.tipo ?? "Todas as sociedades"}</p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="h-9 w-[142px] border-white/15 bg-white/10 text-xs text-white"><SelectValue /></SelectTrigger>
          <SelectContent>{periodos.map((item) => <SelectItem key={item.valor} value={item.valor}>{item.rotulo}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </section>
  );
}
