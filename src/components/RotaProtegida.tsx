import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { PinGate } from "@/components/PinGate";


interface RotaProtegidaProps {
  children: ReactNode;
  papeis?: AppRole[];
}

export function RotaProtegida({ children, papeis }: RotaProtegidaProps) {
  const { user, perfil, papeis: papeisUsuario, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (perfil && !perfil.ativo) {
    return <Navigate to="/login" replace />;
  }

  if (papeisUsuario.length === 0) {
    return <Navigate to="/acesso-pendente" replace />;
  }

  if (isAdmin) {
    return <PinGate>{children}</PinGate>;
  }

  if (papeis && papeis.length > 0) {
    const tem = papeis.some((p) => papeisUsuario.includes(p));
    if (!tem) return <Navigate to="/acesso-negado" replace />;
  }

  return <PinGate>{children}</PinGate>;
}

