import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  ativo: boolean;
  rotuloAtivo?: string;
  rotuloInativo?: string;
  className?: string;
}

export function StatusBadge({
  ativo,
  rotuloAtivo = "Ativo",
  rotuloInativo = "Inativo",
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        ativo
          ? "border-success/30 bg-success/10 text-success"
          : "border-muted-foreground/30 bg-muted text-muted-foreground",
        className,
      )}
    >
      {ativo ? rotuloAtivo : rotuloInativo}
    </Badge>
  );
}

interface TipoBadgeProps {
  tipo: "entrada" | "saida";
}

export function TipoBadge({ tipo }: TipoBadgeProps) {
  const isEntrada = tipo === "entrada";
  return (
    <Badge
      variant="outline"
      className={cn(
        isEntrada
          ? "border-success/30 bg-success/10 text-success"
          : "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      {isEntrada ? "Entrada" : "Saída"}
    </Badge>
  );
}
