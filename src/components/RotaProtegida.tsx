import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { PinGate } from "@/components/PinGate";

interface RotaProtegidaProps {
  children: ReactNode;
  papeis?: AppRole[];
}

export function RotaProtegida({ children, papeis: papeisPermitidos }: RotaProtegidaProps) {
  const { user, loading, papeis } = useAuth();
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

  if (papeisPermitidos?.length && !papeisPermitidos.some((papel) => papeis.includes(papel))) {
    return <Navigate to="/acesso-negado" replace />;
  }

  return <PinGate>{children}</PinGate>;
}
