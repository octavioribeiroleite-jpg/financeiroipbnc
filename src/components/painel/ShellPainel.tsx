import { CSSProperties, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarPainel } from "./SidebarPainel";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { HelpCircle, Lock } from "lucide-react";
import { TourLauncher } from "@/components/tour/TourLauncher";
import { iniciarTour, reexibirTodosTours, temTourPara } from "@/lib/tour/tours";
import { toast } from "sonner";

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
  const { perfil, papelPrincipal, user } = useAuth();
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
          <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border/80 bg-card/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/90 sm:px-5 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span data-tour="sidebar-trigger">
                <SidebarTrigger className="h-10 w-10 rounded-xl border border-border/80 bg-card text-foreground shadow-sm hover:bg-muted" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-foreground sm:text-lg">{titulo}</h1>
                {descricao && <p className="hidden truncate text-xs text-muted-foreground sm:block">{descricao}</p>}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAjuda}
                data-tour="ajuda-tour"
                title="Reexibir dicas desta tela"
                className="h-10 rounded-xl px-3 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <HelpCircle className="h-[18px] w-[18px]" />
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
                className="h-10 rounded-xl px-3 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Lock className="h-[18px] w-[18px]" />
                <span className="hidden lg:inline">Travar</span>
              </Button>

              <div className="ml-1 flex items-center gap-2 border-l border-border/80 pl-2 sm:ml-2 sm:gap-3 sm:pl-4">
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

          <main className="flex-1 p-4 sm:p-5 lg:p-6 2xl:p-8">
            <div className="mx-auto w-full max-w-[1720px]">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
