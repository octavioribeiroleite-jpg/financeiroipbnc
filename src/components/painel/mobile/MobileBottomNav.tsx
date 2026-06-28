import { Link } from "react-router-dom";
import { BarChart3, Home, Plus, Receipt } from "lucide-react";

export function MobileBottomNav() {
  return (
    <div className="mobile-bank-nav md:hidden">
      <Link to="/painel/administrador"><Home className="h-5 w-5" /><span>Painel</span></Link>
      <Link to="/sociedade/extrato"><Receipt className="h-5 w-5" /><span>Movimentos</span></Link>
      <Link to="/sociedade/contribuicoes" className="mobile-bank-nav-main"><Plus className="h-7 w-7" /><span>Registrar</span></Link>
      <Link to="/igreja/relatorios"><BarChart3 className="h-5 w-5" /><span>Relatórios</span></Link>
    </div>
  );
}
