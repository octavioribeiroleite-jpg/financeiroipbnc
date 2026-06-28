import { useMemo, useState } from "react";
import PainelAdministradorDesktop from "./Administrador";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { PainelBancarioMobile } from "@/components/painel/PainelBancarioMobile";
import { useSaldoPorSociedade } from "@/hooks/igreja/useSaldoPorSociedade";
import { useSociedadeOperacional } from "@/contexts/SociedadeOperacionalContext";
import { primeiroDiaMesAtual } from "@/lib/format";

function criarPeriodos() {
  const hoje = new Date();
  return Array.from({ length: 12 }, (_, indice) => {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - indice, 1);
    const valor = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-01`;
    const texto = data.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(" de ", "/");
    return { valor, rotulo: texto.charAt(0).toUpperCase() + texto.slice(1) };
  });
}

export default function AdministradorBancario() {
  const [periodo, setPeriodo] = useState(primeiroDiaMesAtual());
  const { sociedadeSelecionadaId } = useSociedadeOperacional();
  const { data: saldos = [] } = useSaldoPorSociedade(periodo);
  const periodos = useMemo(criarPeriodos, []);

  const selecionada = saldos.find((item) => item.sociedadeId === sociedadeSelecionadaId);
  const resumo = selecionada
    ? {
        saldo: selecionada.saldoAtual,
        entradas: selecionada.entradasMes,
        saidas: selecionada.saidasMes,
        resultado: selecionada.entradasMes - selecionada.saidasMes,
      }
    : {
        saldo: saldos.reduce((total, item) => total + item.saldoAtual, 0),
        entradas: saldos.reduce((total, item) => total + item.entradasMes, 0),
        saidas: saldos.reduce((total, item) => total + item.saidasMes, 0),
        resultado: saldos.reduce((total, item) => total + item.entradasMes - item.saidasMes, 0),
      };

  return (
    <>
      <div className="md:hidden">
        <ShellPainel titulo="Painel" descricao="Resumo financeiro">
          <PainelBancarioMobile
            periodo={periodo}
            setPeriodo={setPeriodo}
            periodos={periodos}
            saldo={resumo.saldo}
            entradas={resumo.entradas}
            saidas={resumo.saidas}
            resultado={resumo.resultado}
            saldos={saldos}
          />
        </ShellPainel>
      </div>
      <div className="hidden md:block"><PainelAdministradorDesktop /></div>
    </>
  );
}
