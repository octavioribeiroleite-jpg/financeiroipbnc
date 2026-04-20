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
  BarChart3,
  ShieldCheck,
  BookCheck,
  Settings,
  Receipt,
} from "lucide-react";

interface ItemMenu {
  titulo: string;
  url: string;
  icone: typeof LayoutDashboard;
  papeis: AppRole[];
}

const PAINEIS: ItemMenu[] = [
  { titulo: "Painel", url: "/painel/administrador", icone: LayoutDashboard, papeis: ["administrador"] },
];

const SOCIEDADE: ItemMenu[] = [
  { titulo: "Extrato por sociedade", url: "/sociedade/extrato", icone: Receipt, papeis: ["administrador"] },
  { titulo: "Contribuições", url: "/sociedade/contribuicoes", icone: HandCoins, papeis: ["administrador"] },
  { titulo: "Pagamentos", url: "/sociedade/solicitacoes", icone: FileText, papeis: ["administrador"] },
  { titulo: "Fechamentos", url: "/sociedade/fechamentos", icone: BookCheck, papeis: ["administrador"] },
];

const CENTRAL: ItemMenu[] = [
  { titulo: "Conferir contribuições", url: "/central/contribuicoes", icone: CheckCheck, papeis: ["administrador"] },
  { titulo: "Processar pagamentos", url: "/central/solicitacoes", icone: ClipboardCheck, papeis: ["administrador"] },
  { titulo: "Conferir fechamentos", url: "/central/fechamentos", icone: BookCheck, papeis: ["administrador"] },
];

const IGREJA: ItemMenu[] = [
  { titulo: "Consolidação mensal", url: "/igreja/fechamentos", icone: BookCheck, papeis: ["administrador"] },
  { titulo: "Relatórios", url: "/igreja/relatorios", icone: BarChart3, papeis: ["administrador"] },
  { titulo: "Auditoria", url: "/igreja/auditoria", icone: ShieldCheck, papeis: ["administrador"] },
];

const CADASTROS: ItemMenu[] = [
  { titulo: "Sociedades", url: "/cadastros/sociedades", icone: Building2, papeis: ["administrador"] },
  { titulo: "Categorias", url: "/cadastros/categorias", icone: Tags, papeis: ["administrador"] },
  { titulo: "Fornecedores", url: "/cadastros/fornecedores", icone: Briefcase, papeis: ["administrador"] },
  { titulo: "Configurações", url: "/cadastros/igreja", icone: Settings, papeis: ["administrador"] },
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
  const igrejaVisiveis = IGREJA.filter((i) => podeVer(i, papeis));
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
            <SidebarGroupLabel>Lançamentos</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{sociedadeVisiveis.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {centralVisiveis.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Processamento</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{centralVisiveis.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {igrejaVisiveis.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Fechamentos e relatórios</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{igrejaVisiveis.map(renderItem)}</SidebarMenu>
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
