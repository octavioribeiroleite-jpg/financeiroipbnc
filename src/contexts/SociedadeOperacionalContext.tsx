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
  setSociedadeSelecionadaId: (sociedadeId: string) => void;
  carregando: boolean;
}

const SociedadeOperacionalContext = createContext<SociedadeOperacionalContextValue | undefined>(undefined);
const STORAGE_KEY = "sociedade_operacional_id";

// Lê o valor salvo já no primeiro render para evitar flash de "selecione uma sociedade"
function lerIdSalvo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function SociedadeOperacionalProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  // Inicializa direto do localStorage — sem useEffect adicional → sem flash
  const [sociedadeSelecionadaId, setSociedadeSelecionadaIdState] = useState<string | null>(lerIdSalvo);

  const { data: sociedades = [], isLoading } = useQuery({
    queryKey: ["sociedades-operacionais"],
    // Habilita assim que existir um usuário autenticado (não depende mais de isAdmin assíncrono)
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000, // 5min — a lista quase nunca muda
    gcTime: 30 * 60 * 1000,
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

  // Sincroniza fallback APENAS quando a lista chega e o id atual é inválido
  useEffect(() => {
    if (!sociedades.length) return;

    const valido = sociedadeSelecionadaId && sociedades.some((s) => s.id === sociedadeSelecionadaId);
    if (valido) return;

    const fallback = sociedades[0].id;
    setSociedadeSelecionadaIdState(fallback);
    try {
      window.localStorage.setItem(STORAGE_KEY, fallback);
    } catch {
      /* ignore */
    }
  }, [sociedades, sociedadeSelecionadaId]);

  // Limpa quando o usuário desloga
  useEffect(() => {
    if (!user) {
      setSociedadeSelecionadaIdState(null);
    }
  }, [user]);

  const setSociedadeSelecionadaId = useCallback((sociedadeId: string) => {
    if (!sociedadeId) return;
    setSociedadeSelecionadaIdState(sociedadeId);
    try {
      window.localStorage.setItem(STORAGE_KEY, sociedadeId);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<SociedadeOperacionalContextValue>(() => ({
    sociedades,
    sociedadeSelecionadaId,
    sociedadeSelecionada: sociedades.find((s) => s.id === sociedadeSelecionadaId) ?? null,
    setSociedadeSelecionadaId,
    carregando: isLoading,
  }), [isLoading, sociedadeSelecionadaId, sociedades, setSociedadeSelecionadaId]);

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
