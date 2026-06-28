import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import type { AppRole } from "@/contexts/AuthContext";
import { SociedadeOperacionalProvider } from "@/contexts/SociedadeOperacionalContext";
import { RotaProtegida } from "@/components/RotaProtegida";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import AcessoNegado from "./pages/AcessoNegado.tsx";
import AcessoPendente from "./pages/AcessoPendente.tsx";
import PainelAdministrador from "./pages/painel/Administrador.tsx";
import PainelIgreja from "./pages/painel/Igreja.tsx";
import PainelCentral from "./pages/painel/Central.tsx";
import PainelSociedade from "./pages/painel/Sociedade.tsx";
import CadastroSociedades from "./pages/cadastros/Sociedades.tsx";
import CadastroUsuarios from "./pages/cadastros/Usuarios.tsx";
import CadastroCategorias from "./pages/cadastros/Categorias.tsx";
import CadastroFornecedores from "./pages/cadastros/Fornecedores.tsx";
import ConfiguracoesIgreja from "./pages/cadastros/Igreja.tsx";
import SociedadeContribuicoes from "./pages/sociedade/Contribuicoes.tsx";
import SociedadeSolicitacoes from "./pages/sociedade/Solicitacoes.tsx";
import SociedadeExtrato from "./pages/sociedade/Extrato.tsx";
import CentralContribuicoes from "./pages/central/Contribuicoes.tsx";
import CentralSolicitacoes from "./pages/central/Solicitacoes.tsx";
import IgrejaRelatorios from "./pages/igreja/Relatorios.tsx";
import IgrejaAuditoria from "./pages/igreja/Auditoria.tsx";
import SociedadeFechamentos from "./pages/sociedade/Fechamentos.tsx";
import CentralFechamentos from "./pages/central/Fechamentos.tsx";
import IgrejaFechamentos from "./pages/igreja/Fechamentos.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const PAPEIS_ADMIN: AppRole[] = ["administrador"];
const PAPEIS_IGREJA: AppRole[] = ["administrador", "tesoureiro_igreja"];
const PAPEIS_CENTRAL: AppRole[] = ["administrador", "tesoureiro_central"];
const PAPEIS_SOCIEDADE: AppRole[] = ["administrador", "tesoureiro_sociedade"];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SociedadeOperacionalProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/acesso-negado" element={<AcessoNegado />} />
              <Route
                path="/acesso-pendente"
                element={
                  <RotaProtegida>
                    <AcessoPendente />
                  </RotaProtegida>
                }
              />
              <Route
                path="/"
                element={
                  <RotaProtegida>
                    <Index />
                  </RotaProtegida>
                }
              />
              <Route
                path="/painel/administrador"
                element={
                  <RotaProtegida papeis={PAPEIS_ADMIN}>
                    <PainelAdministrador />
                  </RotaProtegida>
                }
              />
              <Route
                path="/painel/igreja"
                element={
                  <RotaProtegida papeis={PAPEIS_IGREJA}>
                    <PainelIgreja />
                  </RotaProtegida>
                }
              />
              <Route
                path="/painel/central"
                element={
                  <RotaProtegida papeis={PAPEIS_CENTRAL}>
                    <PainelCentral />
                  </RotaProtegida>
                }
              />
              <Route
                path="/painel/sociedade"
                element={
                  <RotaProtegida papeis={PAPEIS_SOCIEDADE}>
                    <PainelSociedade />
                  </RotaProtegida>
                }
              />
              <Route
                path="/cadastros/sociedades"
                element={
                  <RotaProtegida papeis={PAPEIS_ADMIN}>
                    <CadastroSociedades />
                  </RotaProtegida>
                }
              />
              <Route
                path="/cadastros/usuarios"
                element={
                  <RotaProtegida papeis={PAPEIS_ADMIN}>
                    <CadastroUsuarios />
                  </RotaProtegida>
                }
              />
              <Route
                path="/cadastros/categorias"
                element={
                  <RotaProtegida papeis={PAPEIS_ADMIN}>
                    <CadastroCategorias />
                  </RotaProtegida>
                }
              />
              <Route
                path="/cadastros/fornecedores"
                element={
                  <RotaProtegida papeis={PAPEIS_CENTRAL}>
                    <CadastroFornecedores />
                  </RotaProtegida>
                }
              />
              <Route
                path="/cadastros/igreja"
                element={
                  <RotaProtegida papeis={PAPEIS_IGREJA}>
                    <ConfiguracoesIgreja />
                  </RotaProtegida>
                }
              />
              <Route
                path="/sociedade/extrato"
                element={
                  <RotaProtegida papeis={PAPEIS_SOCIEDADE}>
                    <SociedadeExtrato />
                  </RotaProtegida>
                }
              />
              <Route
                path="/sociedade/contribuicoes"
                element={
                  <RotaProtegida papeis={PAPEIS_SOCIEDADE}>
                    <SociedadeContribuicoes />
                  </RotaProtegida>
                }
              />
              <Route
                path="/sociedade/solicitacoes"
                element={
                  <RotaProtegida papeis={PAPEIS_SOCIEDADE}>
                    <SociedadeSolicitacoes />
                  </RotaProtegida>
                }
              />
              <Route
                path="/central/contribuicoes"
                element={
                  <RotaProtegida papeis={PAPEIS_CENTRAL}>
                    <CentralContribuicoes />
                  </RotaProtegida>
                }
              />
              <Route
                path="/central/solicitacoes"
                element={
                  <RotaProtegida papeis={PAPEIS_CENTRAL}>
                    <CentralSolicitacoes />
                  </RotaProtegida>
                }
              />
              <Route
                path="/igreja/relatorios"
                element={
                  <RotaProtegida papeis={PAPEIS_IGREJA}>
                    <IgrejaRelatorios />
                  </RotaProtegida>
                }
              />
              <Route
                path="/igreja/auditoria"
                element={
                  <RotaProtegida papeis={PAPEIS_IGREJA}>
                    <IgrejaAuditoria />
                  </RotaProtegida>
                }
              />
              <Route
                path="/sociedade/fechamentos"
                element={
                  <RotaProtegida papeis={PAPEIS_SOCIEDADE}>
                    <SociedadeFechamentos />
                  </RotaProtegida>
                }
              />
              <Route
                path="/central/fechamentos"
                element={
                  <RotaProtegida papeis={PAPEIS_CENTRAL}>
                    <CentralFechamentos />
                  </RotaProtegida>
                }
              />
              <Route
                path="/igreja/fechamentos"
                element={
                  <RotaProtegida papeis={PAPEIS_IGREJA}>
                    <IgrejaFechamentos />
                  </RotaProtegida>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SociedadeOperacionalProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
