import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Church,
  LayoutDashboard,
  Users,
  Building2,
  Tags,
  Briefcase,
  HandCoins,
  FileText,
  CheckCheck,
  ClipboardCheck,
} from "lucide-react";

interface ItemMenu {
  titulo: string;
  url: string;
  icone: typeof LayoutDashboard;
  papeis: AppRole[];
}

const PAINEIS: ItemMenu[] = [
  { titulo: "Painel", url: "/painel/administrador", icone: LayoutDashboard, papeis: ["administrador"] },
  { titulo: "Painel", url: "/painel/igreja", icone: LayoutDashboard, papeis: ["tesoureiro_igreja"] },
  { titulo: "Painel", url: "/painel/central", icone: LayoutDashboard, papeis: ["tesoureiro_central"] },
  { titulo: "Painel", url: "/painel/sociedade", icone: LayoutDashboard, papeis: ["tesoureiro_sociedade"] },
];

const SOCIEDADE: ItemMenu[] = [
  { titulo: "Contribuições", url: "/sociedade/contribuicoes", icone: HandCoins, papeis: ["tesoureiro_sociedade"] },
  { titulo: "Solicitações", url: "/sociedade/solicitacoes", icone: FileText, papeis: ["tesoureiro_sociedade"] },
];

const CENTRAL: ItemMenu[] = [
  { titulo: "Conferir contribuições", url: "/central/contribuicoes", icone: CheckCheck, papeis: ["administrador", "tesoureiro_central"] },
  { titulo: "Analisar solicitações", url: "/central/solicitacoes", icone: ClipboardCheck, papeis: ["administrador", "tesoureiro_central"] },
];

const CADASTROS: ItemMenu[] = [
  { titulo: "Sociedades", url: "/cadastros/sociedades", icone: Building2, papeis: ["administrador"] },
  { titulo: "Usuários", url: "/cadastros/usuarios", icone: Users, papeis: ["administrador"] },
  { titulo: "Categorias", url: "/cadastros/categorias", icone: Tags, papeis: ["administrador"] },
  { titulo: "Fornecedores", url: "/cadastros/fornecedores", icone: Briefcase, papeis: ["administrador", "tesoureiro_central"] },
];

function podeVer(item: ItemMenu, papeis: AppRole[]) {
  return item.papeis.some((p) => papeis.includes(p));
}

export function SidebarPainel() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { papeis } = useAuth();
  const location = useLocation();

  const paineisVisiveis = PAINEIS.filter((i) => podeVer(i, papeis));
  const sociedadeVisiveis = SOCIEDADE.filter((i) => podeVer(i, papeis));
  const centralVisiveis = CENTRAL.filter((i) => podeVer(i, papeis));
  const cadastrosVisiveis = CADASTROS.filter((i) => podeVer(i, papeis));

  const isActive = (url: string) => location.pathname === url;

  const renderItem = (item: ItemMenu) => (
    <SidebarMenuItem key={item.url}>
      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.titulo}>
        <NavLink
          to={item.url}
          end
          className="flex items-center gap-2"
          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        >
          <item.icone className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{item.titulo}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Church className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">Tesouraria</p>
              <p className="truncate text-xs text-sidebar-foreground/70">Presbiteriana</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {paineisVisiveis.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Visão geral</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{paineisVisiveis.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {sociedadeVisiveis.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Sociedade</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{sociedadeVisiveis.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {centralVisiveis.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Tesouraria Central</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{centralVisiveis.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {cadastrosVisiveis.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Cadastros</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{cadastrosVisiveis.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
