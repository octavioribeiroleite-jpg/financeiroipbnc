import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarPainel } from "./SidebarPainel";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { HelpCircle, Lock } from "lucide-react";
import { TourLauncher } from "@/components/tour/TourLauncher";
import { iniciarTour, reexibirTodosTours, temTourPara } from "@/lib/tour/tours";
import { toast } from "sonner";
import { LogoTesouraria } from "@/components/brand/LogoTesouraria";
import { SeletorSociedade } from "@/components/painel/SeletorSociedade";
import { useSociedadeOperacional } from "@/contexts/SociedadeOperacionalContext";


interface ShellPainelProps {
  children: ReactNode;
  titulo: string;
  descricao?: string;
}

export function ShellPainel({ children, titulo, descricao }: ShellPainelProps) {
  const { user } = useAuth();
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
    <SidebarProvider>
      <TourLauncher />
      <div className="flex min-h-screen w-full bg-background">
        <SidebarPainel />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/95 px-3 backdrop-blur sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span data-tour="sidebar-trigger">
                <SidebarTrigger />
              </span>
              <div className="hidden min-w-0 sm:block">
                <h1 className="truncate text-[15px] font-semibold leading-tight text-foreground">
                  {titulo}
                </h1>
                {descricao && (
                  <p className="truncate text-xs text-muted-foreground">{descricao}</p>
                )}
              </div>
              <div className="sm:hidden">
                <LogoTesouraria variant="icon" theme="light" size="sm" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <SeletorSociedade />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAjuda}
                data-tour="ajuda-tour"
                title="Reexibir dicas desta tela"
                aria-label="Ajuda"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden lg:inline">Ajuda</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  sessionStorage.removeItem("pin_desbloqueado");
                  window.location.reload();
                }}
                title="Travar com PIN"
                aria-label="Travar com PIN"
              >
                <Lock className="h-4 w-4" />
                <span className="hidden lg:inline">Travar</span>
              </Button>
            </div>
          </header>

          <div className="border-b border-border bg-card/60 px-3 py-2 md:hidden">
            <SeletorSociedade />
          </div>

          <main className="flex-1 p-4 sm:p-6 2xl:p-8">
            <div className="mx-auto w-full max-w-[1720px]">
              <div className="mb-5 sm:hidden">
                <h1 className="text-xl font-semibold text-foreground">{titulo}</h1>
                {descricao && (
                  <p className="text-sm text-muted-foreground">{descricao}</p>
                )}
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
