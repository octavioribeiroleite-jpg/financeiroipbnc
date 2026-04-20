import { Link } from "react-router-dom";
import { ShellPainel } from "@/components/painel/ShellPainel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Tags, Briefcase, ArrowRight } from "lucide-react";
import { useSociedades } from "@/hooks/cadastros/useSociedades";
import { useUsuariosComPapeis } from "@/hooks/cadastros/useUsuarios";
import { useCategorias } from "@/hooks/cadastros/useCategorias";
import { useFornecedores } from "@/hooks/cadastros/useFornecedores";

interface AtalhoProps {
  titulo: string;
  descricao: string;
  icone: typeof Building2;
  para: string;
  contagem?: number;
  carregando?: boolean;
}

function Atalho({ titulo, descricao, icone: Icone, para, contagem, carregando }: AtalhoProps) {
  return (
    <Link to={para} className="group block">
      <Card className="h-full transition-shadow hover:shadow-[var(--shadow-elegant)]">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icone className="h-5 w-5" />
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </CardHeader>
        <CardContent>
          <CardTitle className="text-base">{titulo}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{descricao}</p>
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {carregando ? "—" : (contagem ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">ativos</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function PainelAdministrador() {
  const sociedades = useSociedades();
  const usuarios = useUsuariosComPapeis();
  const categorias = useCategorias();
  const fornecedores = useFornecedores();

  return (
    <ShellPainel
      titulo="Painel do Administrador"
      descricao="Gestão de cadastros institucionais."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Atalho
          titulo="Sociedades"
          descricao="Sociedades internas da igreja."
          icone={Building2}
          para="/cadastros/sociedades"
          carregando={sociedades.isLoading}
          contagem={(sociedades.data ?? []).filter((s) => s.status === "ativa").length}
        />
        <Atalho
          titulo="Usuários"
          descricao="Acesso e papéis do sistema."
          icone={Users}
          para="/cadastros/usuarios"
          carregando={usuarios.isLoading}
          contagem={(usuarios.data ?? []).filter((u) => u.ativo).length}
        />
        <Atalho
          titulo="Categorias"
          descricao="Entradas e saídas financeiras."
          icone={Tags}
          para="/cadastros/categorias"
          carregando={categorias.isLoading}
          contagem={(categorias.data ?? []).filter((c) => c.ativo).length}
        />
        <Atalho
          titulo="Fornecedores"
          descricao="Prestadores e fornecedores."
          icone={Briefcase}
          para="/cadastros/fornecedores"
          carregando={fornecedores.isLoading}
          contagem={(fornecedores.data ?? []).filter((f) => f.ativo).length}
        />
      </div>
    </ShellPainel>
  );
}
