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
    } else {
      reexibirTodosTours();
      toast.success("Dicas reabilitadas", {
        description: "Visite cada tela para ver o passo a passo novamente.",
      });
    }
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
          <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 border-b border-border bg-card/95 px-3 backdrop-blur sm:px-5 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span data-tour="sidebar-trigger">
                <SidebarTrigger className="h-10 w-10 rounded-xl border border-border/80 bg-card shadow-sm hover:bg-muted" />
              </span>
              <div className="hidden min-w-0 sm:block">
                <h1 className="truncate text-base font-semibold leading-tight text-foreground">{titulo}</h1>
                {descricao && <p className="truncate text-xs text-muted-foreground">{descricao}</p>}
              </div>
              <div className="sm:hidden">
                <LogoTesouraria variant="icon" theme="light" size="sm" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="hidden xl:block">
                <SeletorSociedade
                  sociedades={sociedades}
                  sociedadeSelecionadaId={sociedadeSelecionadaId}
                  setSociedadeSelecionadaId={setSociedadeSelecionadaId}
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleAjuda}
                data-tour="ajuda-tour"
                title="Reexibir dicas desta tela"
                aria-label="Ajuda"
                className="h-10 rounded-xl px-3"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden lg:inline">Ajuda</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  sessionStorage.removeItem("pin_desbloqueado");
                  window.location.reload();
                }}
                title="Travar com PIN"
                aria-label="Travar com PIN"
                className="h-10 rounded-xl px-3"
              >
                <Lock className="h-4 w-4" />
                <span className="hidden lg:inline">Travar</span>
              </Button>

              <div className="ml-1 flex items-center gap-3 border-l border-border pl-3">
                <div className="hidden min-w-0 text-right md:block">
                  <p className="max-w-[220px] truncate text-sm font-semibold leading-tight text-foreground">
                    {perfil?.nome ?? "Usuário"}
                  </p>
                  <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                    {papelPrincipal ? ROTULO_PAPEL[papelPrincipal] : "Sem papel"}
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gold-500 text-sm font-bold text-brand-navy-950 shadow-sm ring-2 ring-brand-gold-500/20"
                  title={`${perfil?.nome ?? "Usuário"} · ${papelPrincipal ? ROTULO_PAPEL[papelPrincipal] : "Sem papel"}`}
                >
                  {iniciais(perfil?.nome)}
                </div>
              </div>
            </div>
          </header>

          <div className="border-b border-border bg-card/60 px-3 py-2 xl:hidden">
            <SeletorSociedade
              sociedades={sociedades}
              sociedadeSelecionadaId={sociedadeSelecionadaId}
              setSociedadeSelecionadaId={setSociedadeSelecionadaId}
            />
          </div>

          <main className="flex-1 p-4 sm:p-6 2xl:p-8">
            <div className="mx-auto w-full max-w-[1720px]">
              <div className="mb-5 sm:hidden">
                <h1 className="text-xl font-semibold text-foreground">{titulo}</h1>
                {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
