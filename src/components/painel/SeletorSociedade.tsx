import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { useSociedadeOperacional } from "@/contexts/SociedadeOperacionalContext";
import { cn } from "@/lib/utils";

type SociedadeOperacional = ReturnType<typeof useSociedadeOperacional>["sociedades"][number];

interface SeletorSociedadeProps {
  sociedades: SociedadeOperacional[];
  sociedadeSelecionadaId: string | null;
  setSociedadeSelecionadaId: (sociedadeId: string | null) => void;
  className?: string;
  mostrarGeral?: boolean;
}

export function SeletorSociedade({
  sociedades,
  sociedadeSelecionadaId,
  setSociedadeSelecionadaId,
  className,
  mostrarGeral = true,
}: SeletorSociedadeProps) {
  const [aberto, setAberto] = useState(false);
  const selecionada = sociedades.find((s) => s.id === sociedadeSelecionadaId) ?? null;

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
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {selecionada?.nome ?? "Geral da conta"}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {selecionada ? `${selecionada.tipo} em detalhes` : "Caixa consolidado"}
              </span>
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(360px,calc(100vw-2rem))] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar sociedade..." />
          <CommandList>
            <CommandEmpty>Nenhuma sociedade encontrada.</CommandEmpty>
            {mostrarGeral && (
              <CommandGroup heading="Visão geral">
                <CommandItem
                  value="geral conta consolidado todas sociedades"
                  onSelect={() => {
                    setSociedadeSelecionadaId(null);
                    setAberto(false);
                  }}
                  className="gap-3 py-3"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      !sociedadeSelecionadaId ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">Geral da conta</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      Saldo consolidado de todas as sociedades
                    </span>
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Detalhar sociedade">
              {sociedades.map((sociedade) => (
                <CommandItem
                  key={sociedade.id}
                  value={`${sociedade.nome} ${sociedade.tipo}`}
                  onSelect={() => {
                    setSociedadeSelecionadaId(sociedade.id);
                    setAberto(false);
                  }}
                  className="gap-3 py-3"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      sociedadeSelecionadaId === sociedade.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{sociedade.nome}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {sociedade.tipo} em detalhes
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
