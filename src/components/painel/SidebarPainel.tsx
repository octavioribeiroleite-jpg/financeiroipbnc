import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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
import { LogoTesouraria } from "@/components/brand/LogoTesouraria";
import {
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

const MENU: GrupoMenu[] = [
  {
    rotulo: "Visão geral",
    itens: [
      { titulo: "Painel", url: "/painel/administrador", icone: LayoutDashboard },
      { titulo: "Extrato", url: "/sociedade/extrato", icone: Receipt },
    ],
  },
  {
    rotulo: "Operação",
    itens: [
      { titulo: "Entradas", url: "/sociedade/contribuicoes", icone: HandCoins },
      { titulo: "Pagamentos", url: "/central/solicitacoes", icone: FileText },
      { titulo: "Fechamentos", url: "/sociedade/fechamentos", icone: BookCheck },
    ],
  },
  {
    rotulo: "Igreja",
    itens: [
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

export function SidebarPainel() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

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
            "h-10 rounded-[10px] px-3 transition-all duration-200",
            "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            "group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0",
            "group-data-[collapsible=icon]:justify-center",
            active &&
              "bg-sidebar-accent text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border/60",
          )}
        >
          <NavLink
            to={item.url}
            end
            className={cn("flex items-center gap-3", collapsed && "justify-center")}
          >
            <item.icone
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-transform",
                active ? "stroke-[2.25] text-sidebar-primary" : "text-sidebar-foreground/75",
              )}
            />
            {!collapsed && <span className="truncate text-sm">{item.titulo}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-16 border-b border-sidebar-border/70 p-0">
        <div
          className={cn(
            "flex h-full w-full items-center transition-all duration-200",
            collapsed ? "justify-center" : "px-4",
          )}
          title={collapsed ? "Tesouraria Presbiteriana" : undefined}
        >
          {collapsed ? (
            <LogoTesouraria variant="icon" theme="dark" size="md" />
          ) : (
            <LogoTesouraria variant="horizontal" theme="dark" size="md" />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-3">
        {MENU.map((grupo, indice) => (
          <div key={grupo.rotulo}>
            {indice > 0 && <SidebarSeparator className={cn("my-2", collapsed ? "mx-2" : "mx-4")} />}
            <SidebarGroup className={cn("py-1", collapsed ? "px-1.5" : "px-2")}>
              {!collapsed && (
                <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/55">
                  {grupo.rotulo}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">{grupo.itens.map(renderItem)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
