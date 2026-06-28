import type { SaldoSociedade } from "@/hooks/igreja/useSaldoPorSociedade";
import { MobileBankHeader } from "./mobile/MobileBankHeader";
import { MobileBalanceCard } from "./mobile/MobileBalanceCard";
import { MobileSummaryCards } from "./mobile/MobileSummaryCards";
import { MobileCofrinhos } from "./mobile/MobileCofrinhos";
import { MobileRecentMovements } from "./mobile/MobileRecentMovements";

interface Props {
  periodo: string;
  setPeriodo: (periodo: string) => void;
  periodos: Array<{ valor: string; rotulo: string }>;
  saldo: number;
  entradas: number;
  saidas: number;
  resultado: number;
  saldos: SaldoSociedade[];
}

export function PainelBancarioMobile(props: Props) {
  return (
    <div data-mobile-banking className="-mx-3 -mt-3 pb-24 md:hidden">
      <MobileBankHeader periodo={props.periodo} setPeriodo={props.setPeriodo} periodos={props.periodos} />
      <section className="-mt-20 px-4">
        <MobileBalanceCard saldo={props.saldo} />
        <MobileCofrinhos saldos={props.saldos} />
        <MobileSummaryCards entradas={props.entradas} saidas={props.saidas} resultado={props.resultado} />
        <MobileRecentMovements />
      </section>
    </div>
  );
}
