import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export interface PerfilUsuario {
  id: string;
  nome: string;
  email: string;
  sociedade_id: string | null;
  ativo: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  perfil: PerfilUsuario | null;
  papeis: AppRole[];
  papelPrincipal: AppRole | null;
  sociedadeId: string | null;
  sociedadesIds: string[];
  isAdmin: boolean;
  isIgreja: boolean;
  isCentral: boolean;
  isSociedade: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  recarregarPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const HIERARQUIA: AppRole[] = [
  "administrador",
  "tesoureiro_igreja",
  "tesoureiro_central",
  "tesoureiro_sociedade",
];

function escolherPapelPrincipal(papeis: AppRole[]): AppRole | null {
  if (papeis.includes("administrador")) return "administrador";
  for (const p of HIERARQUIA) {
    if (papeis.includes(p)) return p;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [papeis, setPapeis] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDados = async (userId: string) => {
    const [perfilRes, papeisRes] = await Promise.all([
      supabase.from("usuarios").select("id, nome, email, sociedade_id, ativo").eq("id", userId).maybeSingle(),
      supabase.from("papeis_usuario").select("papel").eq("usuario_id", userId),
    ]);

    if (perfilRes.data) {
      // Se o usuário foi desativado, faz logout imediato
      if (!perfilRes.data.ativo) {
        await supabase.auth.signOut();
        setPerfil(null);
        setPapeis([]);
        return;
      }
      setPerfil(perfilRes.data as PerfilUsuario);
    } else {
      setPerfil(null);
    }

    if (papeisRes.data) {
      setPapeis(papeisRes.data.map((r) => r.papel as AppRole));
    } else {
      setPapeis([]);
    }
  };

  useEffect(() => {
    // 1. Listener PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // Diferir chamadas Supabase para evitar deadlock
        setTimeout(() => {
          carregarDados(newSession.user.id).finally(() => setLoading(false));
        }, 0);
      } else {
        setPerfil(null);
        setPapeis([]);
        setLoading(false);
      }
    });

    // 2. Depois checa sessão existente
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        carregarDados(existing.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setPerfil(null);
    setPapeis([]);
  };

  const recarregarPerfil = async () => {
    if (user) await carregarDados(user.id);
  };

  const papelPrincipal = escolherPapelPrincipal(papeis);

  const value: AuthContextValue = {
    user,
    session,
    perfil,
    papeis,
    papelPrincipal,
    sociedadeId: perfil?.sociedade_id ?? null,
    sociedadesIds: [],
    isAdmin: papeis.includes("administrador"),
    isIgreja: papeis.includes("tesoureiro_igreja"),
    isCentral: papeis.includes("tesoureiro_central"),
    isSociedade: papeis.includes("tesoureiro_sociedade"),
    loading,
    signOut,
    recarregarPerfil,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
