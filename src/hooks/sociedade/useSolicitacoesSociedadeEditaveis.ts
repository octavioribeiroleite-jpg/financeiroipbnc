import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "@/components/ui/sonner";
import type { SolicitacaoInput, StatusSolicitacao } from "@/hooks/sociedade/useSolicitacoesSociedade";

const STATUS_EDITAVEIS: StatusSolicitacao[] = ["rascunho", "enviada"];
const ERRO_BLOQUEADO =
  "Este pagamento já está em análise, aprovado ou pago e não pode mais ser alterado pela sociedade.";

function invalidarFluxo(qc: ReturnType<typeof useQueryClient>, sociedadeId: string | null) {
  qc.invalidateQueries({ queryKey: ["solicitacoes", sociedadeId] });
  qc.invalidateQueries({ queryKey: ["solicitacoes"] });
  qc.invalidateQueries({ queryKey: ["central", "solicitacoes"] });
  qc.invalidateQueries({ queryKey: ["resumo-sociedade"] });
  qc.invalidateQueries({ queryKey: ["igreja"] });
}

export function useAtualizarSolicitacaoEditavel(sociedadeId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: SolicitacaoInput & { id: string; status?: "rascunho" | "enviada" }) => {
      const update: Database["public"]["Tables"]["solicitacoes_pagamento"]["Update"] = {
        fornecedor_id: input.fornecedor_id,
        categoria_id: input.categoria_id || null,
        descricao: input.descricao,
        valor: input.valor,
        vencimento: input.vencimento,
        observacoes: input.observacoes || null,
        anexo_nota_url: input.anexo_nota_url || null,
        comprovantes_pagamento_urls: input.comprovantes_pagamento_urls ?? [],
        recibos_urls: input.recibos_urls ?? [],
      };

      if (input.status) update.status = input.status;

      const { data, error } = await supabase
        .from("solicitacoes_pagamento")
        .update(update)
        .eq("id", id)
        .in("status", STATUS_EDITAVEIS)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error(ERRO_BLOQUEADO);
    },
    onSuccess: (_, input) => {
      invalidarFluxo(qc, sociedadeId);
      toast.success(input.status === "enviada" ? "Pagamento atualizado" : "Rascunho atualizado", {
        description:
          input.status === "enviada"
            ? "As alterações já estão disponíveis para a Central."
            : undefined,
      });
    },
    onError: (e: Error) => toast.error("Falha ao atualizar", { description: e.message }),
  });
}

export function useExcluirSolicitacaoEditavel(sociedadeId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("solicitacoes_pagamento")
        .delete()
        .eq("id", id)
        .in("status", STATUS_EDITAVEIS)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error(ERRO_BLOQUEADO);
    },
    onSuccess: () => {
      invalidarFluxo(qc, sociedadeId);
      toast.success("Pagamento removido");
    },
    onError: (e: Error) => toast.error("Falha ao remover", { description: e.message }),
  });
}
