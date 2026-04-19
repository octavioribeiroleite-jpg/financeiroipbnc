import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Index() {
  const { loading, user, papeis, papelPrincipal, perfil } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (perfil && !perfil.ativo) return <Navigate to="/login" replace />;
  if (papeis.length === 0) return <Navigate to="/acesso-pendente" replace />;

  switch (papelPrincipal) {
    case "administrador":
      return <Navigate to="/painel/administrador" replace />;
    case "tesoureiro_igreja":
      return <Navigate to="/painel/igreja" replace />;
    case "tesoureiro_central":
      return <Navigate to="/painel/central" replace />;
    case "tesoureiro_sociedade":
      return <Navigate to="/painel/sociedade" replace />;
    default:
      return <Navigate to="/acesso-pendente" replace />;
  }
}
