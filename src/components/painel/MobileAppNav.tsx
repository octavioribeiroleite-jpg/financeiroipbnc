import { Link, useLocation } from "react-router-dom";
import { BarChart3, BookCheck, ClipboardCheck, FileText, Home, Plus, Receipt, ShieldCheck } from "lucide-react";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface ItemNav {
  titulo: string;
  rota: string;
  icone: typeof Home;
  principal?: boolean;
}

const ITENS_POR_PAPEL: Record<AppRole, ItemNav[]> = {
  administrador: [
    { titulo: "Painel", rota: "/painel/administrador", icone: Home },
    { titulo: "Extrato", rota: "/sociedade/extrato", icone: Receipt },
    { titulo: "Registrar", rota: "/sociedade/contribuicoes", icone: Plus, principal: true },
    { titulo: "Relatórios", rota: "/igreja/relatorios", icone: BarChart3 },
  ],
  tesoureiro_igreja: [
    { titulo: "Painel", rota: "/painel/igreja", icone: Home },
    { titulo: "Relatórios", rota: "/igreja/relatorios", icone: BarChart3 },
    { titulo: "Fechamentos", rota: "/igreja/fechamentos", icone: BookCheck, principal: true },
    { titulo: "Auditoria", rota: "/igreja/auditoria", icone: ShieldCheck },
  ],
  tesoureiro_central: [
    { titulo: "Painel", rota: "/painel/central", icone: Home },
    { titulo: "Entradas", rota: "/central/contribuicoes", icone: ClipboardCheck },
    { titulo: "Pagamento", rota: "/central/solicitacoes", icone: Plus, principal: true },
    { titulo: "Fechamentos", rota: "/central/fechamentos", icone: BookCheck },
  ],
  tesoureiro_sociedade: [
    { titulo: "Painel", rota: "/painel/sociedade", icone: Home },
    { titulo: "Extrato", rota: "/sociedade/extrato", icone: Receipt },
    { titulo: "Entrada", rota: "/sociedade/contribuicoes", icone: Plus, principal: true },
    { titulo: "Pagamentos", rota: "/sociedade/solicitacoes", icone: FileText },
  ],
};

export function MobileAppNav() {
  const { papelPrincipal } = useAuth();
  const location = useLocation();

  if (!papelPrincipal) return null;
  const itens = ITENS_POR_PAPEL[papelPrincipal];

  return (
    <nav className="mobile-app-nav md:hidden" aria-label="Navegação principal">
      {itens.map((item) => {
        const ativo = location.pathname === item.rota;
        const Icone = item.icone;

        return (
          <Link
            key={item.rota}
            to={item.rota}
            className={cn("mobile-app-nav-item", ativo && "is-active", item.principal && "is-primary")}
          >
            <span className="mobile-app-nav-icon"><Icone className={item.principal ? "h-7 w-7" : "h-5 w-5"} /></span>
            <span>{item.titulo}</span>
          </Link>
        );
      })}
    </nav>
  );
}
