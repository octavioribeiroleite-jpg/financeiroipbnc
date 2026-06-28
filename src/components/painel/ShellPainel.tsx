import { ReactNode } from "react";
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

export function ShellPainel({ children, titulo, descricao }: ShellPainelProps) {
  const { perfil, papelPrincipal, signOut, user } = useAuth();
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
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
