import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export interface UsuarioComPapeis extends Usuario {
  papeis: AppRole[];
}

const KEY = ["usuarios-com-papeis"] as const;

export function useUsuariosComPapeis() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<UsuarioComPapeis[]> => {
      const [usuariosRes, papeisRes] = await Promise.all([
        supabase.from("usuarios").select("*").order("nome", { ascending: true }),
        supabase.from("papeis_usuario").select("usuario_id, papel"),
      ]);
      if (usuariosRes.error) throw usuariosRes.error;
      if (papeisRes.error) throw papeisRes.error;

      const mapa = new Map<string, AppRole[]>();
      (papeisRes.data ?? []).forEach((r) => {
        const lista = mapa.get(r.usuario_id) ?? [];
        lista.push(r.papel as AppRole);
        mapa.set(r.usuario_id, lista);
      });

      return (usuariosRes.data ?? []).map((u) => ({
        ...u,
        papeis: mapa.get(u.id) ?? [],
      }));
    },
  });
}

export interface AtualizarUsuarioInput {
  id: string;
  nome: string;
  sociedade_id: string | null;
  ativo: boolean;
}

export function useAtualizarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AtualizarUsuarioInput) => {
      const { error } = await supabase
        .from("usuarios")
        .update({
          nome: input.nome,
          sociedade_id: input.sociedade_id,
          ativo: input.ativo,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Usuário atualizado");
    },
    onError: (e: Error) => toast.error("Falha ao atualizar usuário", { description: e.message }),
  });
}

export function useDefinirPapeisUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ usuario_id, papeis }: { usuario_id: string; papeis: AppRole[] }) => {
      // Remove todos e reinsere — simples e idempotente.
      const del = await supabase.from("papeis_usuario").delete().eq("usuario_id", usuario_id);
      if (del.error) throw del.error;

      if (papeis.length > 0) {
        const ins = await supabase
          .from("papeis_usuario")
          .insert(papeis.map((papel) => ({ usuario_id, papel })));
        if (ins.error) throw ins.error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Papéis atualizados");
    },
    onError: (e: Error) => toast.error("Falha ao atualizar papéis", { description: e.message }),
  });
}
