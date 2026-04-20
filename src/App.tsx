import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
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
import SociedadeContribuicoes from "./pages/sociedade/Contribuicoes.tsx";
import SociedadeSolicitacoes from "./pages/sociedade/Solicitacoes.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
                <RotaProtegida papeis={["administrador"]}>
                  <PainelAdministrador />
                </RotaProtegida>
              }
            />
            <Route
              path="/painel/igreja"
              element={
                <RotaProtegida papeis={["administrador", "tesoureiro_igreja"]}>
                  <PainelIgreja />
                </RotaProtegida>
              }
            />
            <Route
              path="/painel/central"
              element={
                <RotaProtegida papeis={["administrador", "tesoureiro_central"]}>
                  <PainelCentral />
                </RotaProtegida>
              }
            />
            <Route
              path="/painel/sociedade"
              element={
                <RotaProtegida papeis={["tesoureiro_sociedade"]}>
                  <PainelSociedade />
                </RotaProtegida>
              }
            />
            <Route
              path="/cadastros/sociedades"
              element={
                <RotaProtegida papeis={["administrador"]}>
                  <CadastroSociedades />
                </RotaProtegida>
              }
            />
            <Route
              path="/cadastros/usuarios"
              element={
                <RotaProtegida papeis={["administrador"]}>
                  <CadastroUsuarios />
                </RotaProtegida>
              }
            />
            <Route
              path="/cadastros/categorias"
              element={
                <RotaProtegida papeis={["administrador"]}>
                  <CadastroCategorias />
                </RotaProtegida>
              }
            />
            <Route
              path="/cadastros/fornecedores"
              element={
                <RotaProtegida papeis={["administrador", "tesoureiro_central"]}>
                  <CadastroFornecedores />
                </RotaProtegida>
              }
            />
            <Route
              path="/sociedade/contribuicoes"
              element={
                <RotaProtegida papeis={["tesoureiro_sociedade"]}>
                  <SociedadeContribuicoes />
                </RotaProtegida>
              }
            />
            <Route
              path="/sociedade/solicitacoes"
              element={
                <RotaProtegida papeis={["tesoureiro_sociedade"]}>
                  <SociedadeSolicitacoes />
                </RotaProtegida>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
