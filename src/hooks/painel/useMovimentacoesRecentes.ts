import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MovimentacaoRecente {
  id: string;
  tipo: "entrada" | "saida";
  titulo: string;
  valor: number;
  data: string;
  sociedadeId: string | null;
}

export function useMovimentacoesRecentes(sociedadeId: string | null) {
  return useQuery({
    queryKey: ["painel", "movimentacoes-recentes", sociedadeId ?? "geral"],
    queryFn: async () => {
      let contribuicoesQuery = supabase
        .from("contribuicoes")
        .select("id,membro_nome,valor,data_pagamento,sociedade_id")
        .order("data_pagamento", { ascending: false })
        .limit(8);

      let pagamentosQuery = supabase
        .from("solicitacoes_pagamento")
        .select("id,descricao,valor,data_criacao,sociedade_id,status")
        .in("status", ["enviada", "em_analise", "aprovada", "paga"])
        .order("data_criacao", { ascending: false })
        .limit(8);

      if (sociedadeId) {
        contribuicoesQuery = contribuicoesQuery.eq("sociedade_id", sociedadeId);
        pagamentosQuery = pagamentosQuery.eq("sociedade_id", sociedadeId);
      }

      const [contribuicoesResultado, pagamentosResultado] = await Promise.all([
        contribuicoesQuery,
        pagamentosQuery,
      ]);

      if (contribuicoesResultado.error) throw contribuicoesResultado.error;
      if (pagamentosResultado.error) throw pagamentosResultado.error;

      const entradas: MovimentacaoRecente[] = (contribuicoesResultado.data ?? []).map((item) => ({
        id: `entrada-${item.id}`,
        tipo: "entrada",
        titulo: item.membro_nome || "Entrada confirmada",
        valor: Number(item.valor || 0),
        data: item.data_pagamento,
        sociedadeId: item.sociedade_id,
      }));

      const saidas: MovimentacaoRecente[] = (pagamentosResultado.data ?? []).map((item) => ({
        id: `saida-${item.id}`,
        tipo: "saida",
        titulo: item.descricao || "Pagamento",
        valor: Number(item.valor || 0),
        data: item.data_criacao,
        sociedadeId: item.sociedade_id,
      }));

      return [...entradas, ...saidas]
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 6);
    },
  });
}
