import { ReactNode } from "react";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Church, LogOut } from "lucide-react";

const ROTULO_PAPEL: Record<AppRole, string> = {
  administrador: "Administrador",
  tesoureiro_igreja: "Tesoureiro da Igreja",
  tesoureiro_central: "Tesoureiro Central",
  tesoureiro_sociedade: "Tesoureiro da Sociedade",
};

export function LayoutAutenticado({ children }: { children: ReactNode }) {
  const { perfil, papelPrincipal, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-primary text-primary-foreground shadow-[var(--shadow-card)]">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-foreground/10">
              <Church className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Tesouraria Presbiteriana</h1>
              <p className="text-xs text-primary-foreground/70">Gestão financeira das sociedades</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{perfil?.nome ?? "—"}</p>
              <p className="text-xs text-primary-foreground/70">
                {papelPrincipal ? ROTULO_PAPEL[papelPrincipal] : "Sem papel"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="container flex-1 py-6">{children}</main>
    </div>
  );
}
