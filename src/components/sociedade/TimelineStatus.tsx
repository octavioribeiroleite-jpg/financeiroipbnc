import { Check, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusSolicitacao } from "./StatusSolicitacaoBadge";

interface Etapa {
  chave: StatusSolicitacao;
  rotulo: string;
}

const ETAPAS: Etapa[] = [
  { chave: "rascunho", rotulo: "Rascunho" },
  { chave: "enviada", rotulo: "Enviada" },
  { chave: "em_analise", rotulo: "Em análise" },
  { chave: "aprovada", rotulo: "Aprovada" },
  { chave: "paga", rotulo: "Paga" },
];

const ORDEM: Record<StatusSolicitacao, number> = {
  rascunho: 0,
  enviada: 1,
  em_analise: 2,
  aprovada: 3,
  recusada: 3,
  paga: 4,
};

export function TimelineStatus({ status }: { status: StatusSolicitacao }) {
  const recusada = status === "recusada";
  const indiceAtual = ORDEM[status];

  return (
    <div className="flex w-full items-center">
      {ETAPAS.map((etapa, i) => {
        const concluida = i < indiceAtual || (i === indiceAtual && status !== "rascunho");
        const atual = i === indiceAtual;
        const isAprovada = etapa.chave === "aprovada";
        const mostrarRecusa = recusada && isAprovada;

        return (
          <div key={etapa.chave} className="flex flex-1 items-center last:flex-initial">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2",
                  mostrarRecusa
                    ? "border-destructive bg-destructive text-destructive-foreground"
                    : concluida
                      ? "border-success bg-success text-success-foreground"
                      : atual
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted bg-background text-muted-foreground",
                )}
              >
                {mostrarRecusa ? (
                  <X className="h-4 w-4" />
                ) : concluida ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  mostrarRecusa
                    ? "text-destructive"
                    : atual
                      ? "text-primary"
                      : concluida
                        ? "text-foreground"
                        : "text-muted-foreground",
                )}
              >
                {mostrarRecusa ? "Recusada" : etapa.rotulo}
              </span>
            </div>
            {i < ETAPAS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 flex-1",
                  i < indiceAtual ? "bg-success" : "bg-muted",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
