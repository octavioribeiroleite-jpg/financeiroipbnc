import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Index() {
  const { loading, user, papelPrincipal } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (papelPrincipal === "administrador") return <Navigate to="/painel/administrador" replace />;
  if (papelPrincipal === "tesoureiro_igreja") return <Navigate to="/painel/igreja" replace />;
  if (papelPrincipal === "tesoureiro_central") return <Navigate to="/painel/central" replace />;
  if (papelPrincipal === "tesoureiro_sociedade") return <Navigate to="/painel/sociedade" replace />;

  return <Navigate to="/acesso-pendente" replace />;
}
