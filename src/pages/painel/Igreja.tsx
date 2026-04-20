import { useState } from "react";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { CardsResumoIgreja } from "@/components/igreja/CardsResumoIgreja";
import { FiltroPeriodo } from "@/components/igreja/FiltroPeriodo";
import { GraficoEntradasSaidas } from "@/components/igreja/GraficoEntradasSaidas";
import { GraficoEvolucao } from "@/components/igreja/GraficoEvolucao";
import { TabelaSaldoSociedades } from "@/components/igreja/TabelaSaldoSociedades";
import { useResumoIgreja } from "@/hooks/igreja/useResumoIgreja";
import { useSaldoPorSociedade } from "@/hooks/igreja/useSaldoPorSociedade";
import { useEvolucaoMensal } from "@/hooks/igreja/useEvolucaoMensal";
import { primeiroDiaMesAtual } from "@/lib/format";

export default function PainelIgreja() {
  const [periodo, setPeriodo] = useState<string>(primeiroDiaMesAtual());

  const { data: resumo, isLoading: lr } = useResumoIgreja(periodo);
  const { data: saldos, isLoading: ls } = useSaldoPorSociedade(periodo);
  const { data: evolucao, isLoading: le } = useEvolucaoMensal(6);

  return (
    <ShellPainel
      titulo="Painel da Tesouraria da Igreja"
      descricao="Visão consolidada de todas as sociedades."
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Painel da Tesouraria da Igreja</h2>
          <p className="text-muted-foreground">
            Visão consolidada de todas as sociedades.
          </p>
        </div>
        <FiltroPeriodo value={periodo} onChange={setPeriodo} />
      </div>

      <div className="space-y-4">
        <CardsResumoIgreja resumo={resumo} loading={lr} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GraficoEntradasSaidas dados={saldos} loading={ls} />
          <GraficoEvolucao dados={evolucao} loading={le} />
        </div>
        <TabelaSaldoSociedades dados={saldos} loading={ls} />
      </div>
    </ShellPainel>
  );
}
