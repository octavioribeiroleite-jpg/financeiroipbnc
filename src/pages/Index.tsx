import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Index() {
  const { loading, user, papeis, perfil, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (perfil && !perfil.ativo) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/painel/administrador" replace />;
  if (papeis.length === 0) return <Navigate to="/acesso-pendente" replace />;

  return <Navigate to="/acesso-pendente" replace />;
}
