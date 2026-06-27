import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Building2, Check, ChevronsUpDown, Wallet } from "lucide-react";
import { useSociedadeOperacional } from "@/contexts/SociedadeOperacionalContext";
import { cn } from "@/lib/utils";

type SociedadeOperacional = ReturnType<typeof useSociedadeOperacional>["sociedades"][number];

interface SeletorSociedadeProps {
  sociedades: SociedadeOperacional[];
  sociedadeSelecionadaId: string | null;
  setSociedadeSelecionadaId: (sociedadeId: string | null) => void;
  className?: string;
  mostrarGeral?: boolean;
  simples?: boolean;
}

export function SeletorSociedade({
  sociedades,
  sociedadeSelecionadaId,
  setSociedadeSelecionadaId,
  className,
  mostrarGeral = true,
  simples = false,
}: SeletorSociedadeProps) {
  const [aberto, setAberto] = useState(false);
  const selecionada = sociedades.find((s) => s.id === sociedadeSelecionadaId) ?? null;

  const selecionar = (sociedadeId: string | null) => {
    setSociedadeSelecionadaId(sociedadeId);
    setAberto(false);
  };

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={aberto}
          className={cn("h-auto w-full justify-between gap-3 px-3 py-2 text-left", className)}
        >
          <span className="flex min-w-0 items-center gap-2">
            {!simples && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </span>
            )}
            <span className="min-w-0">
              <span className={cn("block truncate font-medium", simples ? "text-base" : "text-sm")}>
                {selecionada?.nome ?? "Geral da conta"}
              </span>
              {!simples && (
                <span className="block truncate text-xs text-muted-foreground">
                  {selecionada ? `${selecionada.tipo} em detalhes` : "Caixa consolidado"}
                </span>
              )}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(520px,calc(100vw-2rem))] p-3" align="start">
        <div className="mb-3">
          <p className="text-sm font-semibold text-foreground">Escolha a visão</p>
          <p className="text-xs text-muted-foreground">
            Clique em um card para alternar entre o caixa geral e os cofrinhos.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {mostrarGeral && (
            <button
              type="button"
              onClick={() => selecionar(null)}
              className={cn(
                "group flex min-h-[86px] items-start gap-3 rounded-md border p-3 text-left transition-colors",
                !sociedadeSelecionadaId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/50 hover:bg-muted/50",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                  !sociedadeSelecionadaId
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "bg-primary/10 text-primary",
                )}
              >
                <Wallet className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">Geral da conta</span>
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      !sociedadeSelecionadaId ? "opacity-100" : "opacity-0",
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "mt-1 block text-xs",
                    !sociedadeSelecionadaId ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  Saldo consolidado
                </span>
              </span>
            </button>
          )}

          {sociedades.map((sociedade) => {
            const ativo = sociedadeSelecionadaId === sociedade.id;

            return (
              <button
                key={sociedade.id}
                type="button"
                onClick={() => selecionar(sociedade.id)}
                className={cn(
                  "group flex min-h-[86px] items-start gap-3 rounded-md border p-3 text-left transition-colors",
                  ativo
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/50 hover:bg-muted/50",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                    ativo ? "bg-primary-foreground/15 text-primary-foreground" : "bg-primary/10 text-primary",
                  )}
                >
                  <Building2 className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{sociedade.nome}</span>
                    <Check className={cn("h-4 w-4 shrink-0", ativo ? "opacity-100" : "opacity-0")} />
                  </span>
                  <span
                    className={cn(
                      "mt-1 block text-xs",
                      ativo ? "text-primary-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    {sociedade.tipo}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
