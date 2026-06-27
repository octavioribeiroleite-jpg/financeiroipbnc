import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
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
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  Church,
  LayoutDashboard,
  Building2,
  Tags,
  Briefcase,
  HandCoins,
  FileText,
  BarChart3,
  ShieldCheck,
  BookCheck,
  Settings,
  Receipt,
  ClipboardCheck,
} from "lucide-react";

interface ItemMenu {
  titulo: string;
  url: string;
  icone: typeof LayoutDashboard;
}

interface GrupoMenu {
  rotulo: string;
  itens: ItemMenu[];
}

const MENU_ADMIN: GrupoMenu[] = [
  {
    rotulo: "Operação",
    itens: [
      { titulo: "Painel", url: "/painel/administrador", icone: LayoutDashboard },
      { titulo: "Entradas", url: "/sociedade/contribuicoes", icone: HandCoins },
      { titulo: "Saídas", url: "/central/solicitacoes", icone: FileText },
      { titulo: "Fechamento mensal", url: "/sociedade/fechamentos", icone: BookCheck },
      { titulo: "Extrato", url: "/sociedade/extrato", icone: Receipt },
      { titulo: "Relatórios", url: "/igreja/relatorios", icone: BarChart3 },
      { titulo: "Auditoria", url: "/igreja/auditoria", icone: ShieldCheck },
    ],
  },
  {
    rotulo: "Cadastros",
    itens: [
      { titulo: "Sociedades", url: "/cadastros/sociedades", icone: Building2 },
      { titulo: "Categorias", url: "/cadastros/categorias", icone: Tags },
      { titulo: "Fornecedores", url: "/cadastros/fornecedores", icone: Briefcase },
      { titulo: "Configurações", url: "/cadastros/igreja", icone: Settings },
    ],
  },
];

const MENU_IGREJA: GrupoMenu[] = [
  {
    rotulo: "Igreja",
    itens: [
      { titulo: "Painel", url: "/painel/igreja", icone: LayoutDashboard },
      { titulo: "Fechamentos", url: "/igreja/fechamentos", icone: BookCheck },
      { titulo: "Relatórios", url: "/igreja/relatorios", icone: BarChart3 },
      { titulo: "Auditoria", url: "/igreja/auditoria", icone: ShieldCheck },
      { titulo: "Configurações", url: "/cadastros/igreja", icone: Settings },
    ],
  },
];

const MENU_CENTRAL: GrupoMenu[] = [
  {
    rotulo: "Tesouraria central",
    itens: [
      { titulo: "Painel", url: "/painel/central", icone: LayoutDashboard },
      { titulo: "Conferir entradas", url: "/central/contribuicoes", icone: ClipboardCheck },
      { titulo: "Pagamentos", url: "/central/solicitacoes", icone: FileText },
      { titulo: "Fechamentos", url: "/central/fechamentos", icone: BookCheck },
    ],
  },
  {
    rotulo: "Cadastros",
    itens: [{ titulo: "Fornecedores", url: "/cadastros/fornecedores", icone: Briefcase }],
  },
];

const MENU_SOCIEDADE: GrupoMenu[] = [
  {
    rotulo: "Sociedade",
    itens: [
      { titulo: "Painel", url: "/painel/sociedade", icone: LayoutDashboard },
      { titulo: "Entradas", url: "/sociedade/contribuicoes", icone: HandCoins },
      { titulo: "Pagamentos", url: "/sociedade/solicitacoes", icone: FileText },
      { titulo: "Extrato", url: "/sociedade/extrato", icone: Receipt },
      { titulo: "Fechamento mensal", url: "/sociedade/fechamentos", icone: BookCheck },
    ],
  },
];

function menuDoPapel(papel: AppRole | null): GrupoMenu[] {
  if (papel === "administrador") return MENU_ADMIN;
  if (papel === "tesoureiro_igreja") return MENU_IGREJA;
  if (papel === "tesoureiro_central") return MENU_CENTRAL;
  if (papel === "tesoureiro_sociedade") return MENU_SOCIEDADE;
  return [];
}

export function SidebarPainel() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { papelPrincipal } = useAuth();
  const location = useLocation();
  const grupos = menuDoPapel(papelPrincipal);

  const isActive = (url: string) => location.pathname === url;

  const renderItem = (item: ItemMenu) => {
    const active = isActive(item.url);

    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={{ children: item.titulo, sideOffset: 8 }}
          className={cn(
            "h-10 rounded-xl px-3 transition-all duration-200",
            "hover:translate-x-0.5 hover:bg-sidebar-accent/80",
            "group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!p-0",
            "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:hover:translate-x-0",
            active && "shadow-sm ring-1 ring-sidebar-border/70",
          )}
        >
          <NavLink
            to={item.url}
            end
            className={cn("flex items-center gap-3", collapsed && "justify-center")}
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
          >
            <item.icone
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
                active && "scale-105 stroke-[2.25]",
              )}
            />
            {!collapsed && <span className="truncate">{item.titulo}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 border-b border-sidebar-border p-0">
        <div
          className={cn(
            "flex h-full w-full items-center transition-all duration-200",
            collapsed ? "justify-center" : "gap-3 px-3",
          )}
          title={collapsed ? "Tesouraria Presbiteriana" : undefined}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm ring-1 ring-white/10">
            <Church className="h-[18px] w-[18px]" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">Tesouraria</p>
              <p className="truncate text-xs text-sidebar-foreground/65">Presbiteriana</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {grupos.map((grupo, indice) => (
          <div key={grupo.rotulo}>
            {indice > 0 && <SidebarSeparator className={cn("my-2", collapsed ? "mx-2" : "mx-4")} />}
            <SidebarGroup className={cn("py-1", collapsed ? "px-1.5" : "px-2")}>
              {!collapsed && (
                <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em]">
                  {grupo.rotulo}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">{grupo.itens.map(renderItem)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
