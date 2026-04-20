import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CardResumoProps {
  titulo: string;
  valor: string;
  descricao?: string;
  icone: ReactNode;
  cor?: "primary" | "success" | "warning" | "destructive";
}

export function CardResumo({ titulo, valor, descricao, icone, cor = "primary" }: CardResumoProps) {
  const corClasse: Record<NonNullable<CardResumoProps["cor"]>, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-md", corClasse[cor])}>
          {icone}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{titulo}</p>
          <p className="truncate text-lg font-semibold text-foreground">{valor}</p>
          {descricao && <p className="truncate text-xs text-muted-foreground">{descricao}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
