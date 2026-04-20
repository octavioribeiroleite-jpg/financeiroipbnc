import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Sociedade = Database["public"]["Tables"]["sociedades"]["Row"];

interface SociedadeOperacionalContextValue {
  sociedades: Sociedade[];
  sociedadeSelecionadaId: string | null;
  sociedadeSelecionada: Sociedade | null;
  setSociedadeSelecionadaId: (sociedadeId: string) => void;
  carregando: boolean;
}

const SociedadeOperacionalContext = createContext<SociedadeOperacionalContextValue | undefined>(undefined);
const STORAGE_KEY = "sociedade_operacional_id";

export function SociedadeOperacionalProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [sociedadeSelecionadaId, setSociedadeSelecionadaId] = useState<string | null>(null);

  const { data: sociedades = [], isLoading } = useQuery({
    queryKey: ["sociedades-operacionais", user?.id],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sociedades")
        .select("*")
        .eq("status", "ativa")
        .order("nome", { ascending: true });

      if (error) throw error;
      return data as Sociedade[];
    },
  });

  useEffect(() => {
    const salva = localStorage.getItem(STORAGE_KEY);
    if (salva) setSociedadeSelecionadaId(salva);
  }, []);

  useEffect(() => {
    if (!sociedades.length) {
      setSociedadeSelecionadaId(null);
      return;
    }

    const existe = sociedadeSelecionadaId && sociedades.some((sociedade) => sociedade.id === sociedadeSelecionadaId);
    if (existe) return;

    const fallback = sociedades[0].id;
    setSociedadeSelecionadaId(fallback);
    localStorage.setItem(STORAGE_KEY, fallback);
  }, [sociedades, sociedadeSelecionadaId]);

  const value = useMemo<SociedadeOperacionalContextValue>(() => ({
    sociedades,
    sociedadeSelecionadaId,
    sociedadeSelecionada: sociedades.find((sociedade) => sociedade.id === sociedadeSelecionadaId) ?? null,
    setSociedadeSelecionadaId: (sociedadeId: string) => {
      setSociedadeSelecionadaId(sociedadeId);
      localStorage.setItem(STORAGE_KEY, sociedadeId);
    },
    carregando: isLoading,
  }), [isLoading, sociedadeSelecionadaId, sociedades]);

  return (
    <SociedadeOperacionalContext.Provider value={value}>
      {children}
    </SociedadeOperacionalContext.Provider>
  );
}

export function useSociedadeOperacional() {
  const context = useContext(SociedadeOperacionalContext);
  if (!context) throw new Error("useSociedadeOperacional deve ser usado dentro de SociedadeOperacionalProvider");
  return context;
}