import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["status_conferencia"];

const ROTULO: Record<Status, string> = {
  pendente: "Pendente",
  conferida: "Conferida",
  divergente: "Divergente",
};

export function StatusContribuicaoBadge({ status }: { status: Status }) {
  const cor =
    status === "conferida"
      ? "border-success/30 bg-success/10 text-success"
      : status === "divergente"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-warning/30 bg-warning/10 text-warning";
  return (
    <Badge variant="outline" className={cor}>
      {ROTULO[status]}
    </Badge>
  );
}
