import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

export type StatusSolicitacao = Database["public"]["Enums"]["status_solicitacao"];

export const ROTULO_STATUS: Record<StatusSolicitacao, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  em_analise: "Em análise",
  aprovada: "Aprovada",
  recusada: "Recusada",
  paga: "Paga",
};

export function StatusSolicitacaoBadge({ status }: { status: StatusSolicitacao }) {
  const cor: Record<StatusSolicitacao, string> = {
    rascunho: "border-muted-foreground/30 bg-muted text-muted-foreground",
    enviada: "border-primary/30 bg-primary/10 text-primary",
    em_analise: "border-warning/30 bg-warning/10 text-warning",
    aprovada: "border-success/30 bg-success/10 text-success",
    recusada: "border-destructive/30 bg-destructive/10 text-destructive",
    paga: "border-success/40 bg-success/15 text-success",
  };
  return (
    <Badge variant="outline" className={cor[status]}>
      {ROTULO_STATUS[status]}
    </Badge>
  );
}
