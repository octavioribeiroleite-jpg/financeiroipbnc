import { ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarPainel } from "./SidebarPainel";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Building2, Check, ChevronsUpDown, HelpCircle, LogOut } from "lucide-react";
import { TourLauncher } from "@/components/tour/TourLauncher";
import { iniciarTour, reexibirTodosTours, temTourPara } from "@/lib/tour/tours";
import { toast } from "sonner";
import { useSociedadeOperacional } from "@/contexts/SociedadeOperacionalContext";
import { cn } from "@/lib/utils";

const ROTULO_PAPEL: Record<AppRole, string> = {
  administrador: "Operador principal",
  tesoureiro_igreja: "Tesoureiro da Igreja",
  tesoureiro_central: "Tesoureiro Central",
  tesoureiro_sociedade: "Tesoureiro da Sociedade",
};

interface ShellPainelProps {
  children: ReactNode;
  titulo: string;
  descricao?: string;
}

type SociedadeOperacional = ReturnType<typeof useSociedadeOperacional>["sociedades"][number];

interface SeletorSociedadeProps {
  sociedades: SociedadeOperacional[];
  sociedadeSelecionadaId: string | null;
  setSociedadeSelecionadaId: (sociedadeId: string) => void;
  className?: string;
  compacto?: boolean;
}

function SeletorSociedade({
  sociedades,
  sociedadeSelecionadaId,
  setSociedadeSelecionadaId,
  className,
  compacto,
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
          className={cn(
            "h-auto justify-between gap-3 px-3 py-2 text-left",
            compacto ? "w-full" : "min-w-[260px] max-w-[340px]",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {selecionada?.nome ?? "Selecionar sociedade"}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {selecionada ? `${selecionada.tipo} em foco` : "Escolha o cofrinho ativo"}
              </span>
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(360px,calc(100vw-2rem))] p-0" align="end">
        <Command>
          <CommandInput placeholder="Buscar sociedade..." />
          <CommandList>
            <CommandEmpty>Nenhuma sociedade encontrada.</CommandEmpty>
            <CommandGroup heading="Sociedade em foco">
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
                      {sociedade.tipo}
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

export function ShellPainel({ children, titulo, descricao }: ShellPainelProps) {
  const { perfil, papelPrincipal, signOut, user } = useAuth();
  const { sociedades, sociedadeSelecionadaId, setSociedadeSelecionadaId } = useSociedadeOperacional();
  const location = useLocation();

  const handleAjuda = () => {
    if (temTourPara(location.pathname)) {
      iniciarTour(location.pathname, { force: true, userId: user?.id ?? null });
    } else {
      reexibirTodosTours();
      toast.success("Dicas reabilitadas", {
        description: "Visite cada tela para ver o passo a passo novamente.",
      });
    }
  };

  return (
    <SidebarProvider>
      <TourLauncher />
      <div className="flex min-h-screen w-full bg-background">
        <SidebarPainel />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b bg-card px-3 sm:px-4">
            <div className="flex items-center gap-2 min-w-0">
              <span data-tour="sidebar-trigger">
                <SidebarTrigger />
              </span>
              <div className="hidden min-w-0 sm:block">
                <h1 className="truncate text-sm font-semibold text-foreground">{titulo}</h1>
                {descricao && <p className="truncate text-xs text-muted-foreground">{descricao}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {sociedades.length > 0 && (
                <div className="hidden lg:block" data-tour="seletor-sociedade-global">
                  <SeletorSociedade
                    sociedades={sociedades}
                    sociedadeSelecionadaId={sociedadeSelecionadaId}
                    setSociedadeSelecionadaId={setSociedadeSelecionadaId}
                  />
                </div>
              )}
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium leading-tight text-foreground">{perfil?.nome ?? "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {papelPrincipal ? ROTULO_PAPEL[papelPrincipal] : "Sem papel"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAjuda}
                data-tour="ajuda-tour"
                title="Reexibir dicas desta tela"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Ajuda</span>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">
            <div className="mx-auto w-full max-w-7xl">
              <div className="mb-6 sm:hidden">
                <h1 className="text-xl font-semibold text-foreground">{titulo}</h1>
                {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
              </div>
              {sociedades.length > 0 && (
                <div className="mb-4 lg:hidden" data-tour="seletor-sociedade-global">
                  <SeletorSociedade
                    sociedades={sociedades}
                    sociedadeSelecionadaId={sociedadeSelecionadaId}
                    setSociedadeSelecionadaId={setSociedadeSelecionadaId}
                    compacto
                  />
                </div>
              )}
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
