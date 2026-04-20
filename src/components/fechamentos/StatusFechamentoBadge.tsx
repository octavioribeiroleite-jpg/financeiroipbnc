import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["status_fechamento"];

const ROTULO: Record<Status, string> = {
  aberto: "Aberto",
  enviado: "Enviado",
  conferido: "Conferido",
  consolidado: "Consolidado",
};

const COR: Record<Status, string> = {
  aberto: "border-muted-foreground/30 bg-muted text-muted-foreground",
  enviado: "border-warning/30 bg-warning/10 text-warning",
  conferido: "border-primary/30 bg-primary/10 text-primary",
  consolidado: "border-success/30 bg-success/10 text-success",
};

export function StatusFechamentoBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={COR[status]}>
      {ROTULO[status]}
    </Badge>
  );
}

export const ROTULO_FECHAMENTO = ROTULO;
