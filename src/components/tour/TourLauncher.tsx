import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { iniciarTour, temTourPara } from "@/lib/tour/tours";

/**
 * Dispara automaticamente o tour da rota atual na primeira visita do usuário.
 * Aguarda 1 frame após render para os elementos com `data-tour` estarem no DOM.
 */
export function TourLauncher() {
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    if (!temTourPara(location.pathname)) return;
    const t = window.setTimeout(() => {
      iniciarTour(location.pathname, { userId: user.id });
    }, 400);
    return () => window.clearTimeout(t);
  }, [location.pathname, user, loading]);

  return null;
}
