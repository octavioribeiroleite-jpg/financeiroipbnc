import { CSSProperties, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarPainel } from "./SidebarPainel";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { HelpCircle, Lock } from "lucide-react";
import { TourLauncher } from "@/components/tour/TourLauncher";
import { iniciarTour, reexibirTodosTours, temTourPara } from "@/lib/tour/tours";
import { toast } from "sonner";
import { LogoTesouraria } from "@/components/brand/LogoTesouraria";
import { SeletorSociedade } from "@/components/painel/SeletorSociedade";
import { useSociedadeOperacional } from "@/contexts/SociedadeOperacionalContext";

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

function iniciais(nome?: string | null) {
  if (!nome?.trim()) return "TP";
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

export function ShellPainel({ children, titulo, descricao }: ShellPainelProps) {
  const { user, perfil, papelPrincipal } = useAuth();
  const location = useLocation();
  const { sociedades, sociedadeSelecionadaId, setSociedadeSelecionadaId } = useSociedadeOperacional();

  const handleAjuda = () => {
    if (temTourPara(location.pathname)) {
      iniciarTour(location.pathname, { force: true, userId: user?.id ?? null });
      return;
    }

    reexibirTodosTours();
    toast.success("Dicas reabilitadas", {
      description: "Visite cada tela para ver o passo a passo novamente.",
    });
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17rem",
          "--sidebar-width-icon": "4.5rem",
        } as CSSProperties
      }
    >
      <TourLauncher />
      <div className="flex min-h-screen w-full bg-background">
        <SidebarPainel />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border/80 bg-card/95 px-3 backdrop-blur sm:h-16 sm:px-5 lg:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <span data-tour="sidebar-trigger">
                <SidebarTrigger className="h-9 w-9 rounded-xl border border-border/80 bg-card shadow-sm hover:bg-muted sm:h-10 sm:w-10" />
              </span>

              <div className="hidden min-w-0 sm:block">
                <h1 className="truncate text-base font-bold leading-tight text-foreground">{titulo}</h1>
                {descricao && <p className="truncate text-xs text-muted-foreground">{descricao}</p>}
              </div>

              <div className="sm:hidden">
                <LogoTesouraria variant="icon" theme="light" size="sm" />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <div className="hidden xl:block">
                <SeletorSociedade
                  sociedades={sociedades}
                  sociedadeSelecionadaId={sociedadeSelecionadaId}
                  setSociedadeSelecionadaId={setSociedadeSelecionadaId}
                  simples
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleAjuda}
                data-tour="ajuda-tour"
                title="Ajuda"
                aria-label="Ajuda"
                className="h-9 w-9 rounded-xl sm:h-10 sm:w-10"
              >
                <HelpCircle className="h-[18px] w-[18px]" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  sessionStorage.removeItem("pin_desbloqueado");
                  window.location.reload();
                }}
                title="Travar com PIN"
                aria-label="Travar com PIN"
                className="h-9 w-9 rounded-xl sm:h-10 sm:w-10"
              >
                <Lock className="h-[18px] w-[18px]" />
              </Button>

              <div className="ml-1 flex items-center gap-3 border-l border-border pl-2 sm:pl-3">
                <div className="hidden min-w-0 text-right md:block">
                  <p className="max-w-[220px] truncate text-sm font-semibold leading-tight text-foreground">
                    {perfil?.nome ?? "Usuário"}
                  </p>
                  <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                    {papelPrincipal ? ROTULO_PAPEL[papelPrincipal] : "Sem papel"}
                  </p>
                </div>

                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gold-500 text-xs font-bold text-brand-navy-950 shadow-sm ring-2 ring-brand-gold-500/20 sm:h-10 sm:w-10 sm:text-sm"
                  title={`${perfil?.nome ?? "Usuário"} · ${papelPrincipal ? ROTULO_PAPEL[papelPrincipal] : "Sem papel"}`}
                >
                  {iniciais(perfil?.nome)}
                </div>
              </div>
            </div>
          </header>

          <div className="border-b border-border/80 bg-card px-3 py-2 xl:hidden">
            <SeletorSociedade
              sociedades={sociedades}
              sociedadeSelecionadaId={sociedadeSelecionadaId}
              setSociedadeSelecionadaId={setSociedadeSelecionadaId}
              simples
              className="h-11 rounded-xl py-0"
            />
          </div>

          <main className="flex-1 p-3 sm:p-5 lg:p-6 2xl:p-8">
            <div className="mx-auto w-full max-w-[1720px]">
              <div className="mb-4 sm:hidden">
                <h1 className="text-[1.6rem] font-bold leading-tight tracking-[-0.035em] text-foreground">{titulo}</h1>
                {descricao && <p className="mt-1 text-sm leading-snug text-muted-foreground">{descricao}</p>}
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
