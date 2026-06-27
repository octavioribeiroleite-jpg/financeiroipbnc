import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Sociedade = Database["public"]["Tables"]["sociedades"]["Row"];

interface SociedadeOperacionalContextValue {
  sociedades: Sociedade[];
  sociedadeSelecionadaId: string | null;
  sociedadeSelecionada: Sociedade | null;
  setSociedadeSelecionadaId: (sociedadeId: string | null) => void;
  carregando: boolean;
}

const SociedadeOperacionalContext = createContext<SociedadeOperacionalContextValue | undefined>(undefined);
const STORAGE_KEY = "sociedade_operacional_id";

function lerIdSalvo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function SociedadeOperacionalProvider({ children }: { children: ReactNode }) {
  const {
    user,
    loading: authLoading,
    sociedadeId,
    isAdmin,
    isIgreja,
    isCentral,
    isSociedade,
  } = useAuth();
  const podeVerTodas = isAdmin || isIgreja || isCentral;
  const [sociedadeSelecionadaId, setSociedadeSelecionadaIdState] = useState<string | null>(lerIdSalvo);

  const { data: sociedades = [], isLoading } = useQuery({
    queryKey: ["sociedades-operacionais", podeVerTodas ? "todas" : sociedadeId],
    enabled: !!user && !authLoading && (podeVerTodas || (!!sociedadeId && isSociedade)),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      let consulta = supabase
        .from("sociedades")
        .select("*")
        .eq("status", "ativa")
        .order("nome", { ascending: true });

      if (!podeVerTodas && sociedadeId) {
        consulta = consulta.eq("id", sociedadeId);
      }

      const { data, error } = await consulta;
      if (error) throw error;
      return data as Sociedade[];
    },
  });

  useEffect(() => {
    if (!user) {
      setSociedadeSelecionadaIdState(null);
      return;
    }

    if (isSociedade && !podeVerTodas && sociedadeId) {
      setSociedadeSelecionadaIdState(sociedadeId);
      try {
        window.localStorage.setItem(STORAGE_KEY, sociedadeId);
      } catch {
        /* ignore */
      }
      return;
    }

    if (!sociedadeSelecionadaId || !sociedades.length) return;
    const valido = sociedades.some((sociedade) => sociedade.id === sociedadeSelecionadaId);
    if (valido) return;

    setSociedadeSelecionadaIdState(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [isSociedade, podeVerTodas, sociedadeId, sociedadeSelecionadaId, sociedades, user]);

  const setSociedadeSelecionadaId = useCallback(
    (novoId: string | null) => {
      if (isSociedade && !podeVerTodas) return;

      setSociedadeSelecionadaIdState(novoId);
      try {
        if (novoId) {
          window.localStorage.setItem(STORAGE_KEY, novoId);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        /* ignore */
      }
    },
    [isSociedade, podeVerTodas],
  );

  const value = useMemo<SociedadeOperacionalContextValue>(
    () => ({
      sociedades,
      sociedadeSelecionadaId,
      sociedadeSelecionada: sociedades.find((sociedade) => sociedade.id === sociedadeSelecionadaId) ?? null,
      setSociedadeSelecionadaId,
      carregando: isLoading,
    }),
    [isLoading, sociedadeSelecionadaId, sociedades, setSociedadeSelecionadaId],
  );

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
