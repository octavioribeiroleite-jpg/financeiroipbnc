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
} from "lucide-react";

interface ItemMenu {
  titulo: string;
  url: string;
  icone: typeof LayoutDashboard;
  papeis: AppRole[];
}

const OPERACAO: ItemMenu[] = [
  { titulo: "Painel", url: "/painel/administrador", icone: LayoutDashboard, papeis: ["administrador"] },
  { titulo: "Entradas", url: "/sociedade/contribuicoes", icone: HandCoins, papeis: ["administrador"] },
  { titulo: "Saídas", url: "/central/solicitacoes", icone: FileText, papeis: ["administrador"] },
  { titulo: "Fechamento mensal", url: "/sociedade/fechamentos", icone: BookCheck, papeis: ["administrador"] },
  { titulo: "Extrato", url: "/sociedade/extrato", icone: Receipt, papeis: ["administrador"] },
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

  const operacaoVisiveis = OPERACAO.filter((i) => podeVer(i, papeis));
  const cadastrosVisiveis = CADASTROS.filter((i) => podeVer(i, papeis));

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
        {operacaoVisiveis.length > 0 && (
          <SidebarGroup className={cn("py-1", collapsed ? "px-1.5" : "px-2")}>
            {!collapsed && (
              <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em]">
                Operação
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">{operacaoVisiveis.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {operacaoVisiveis.length > 0 && cadastrosVisiveis.length > 0 && (
          <SidebarSeparator className={cn("my-2", collapsed ? "mx-2" : "mx-4")} />
        )}

        {cadastrosVisiveis.length > 0 && (
          <SidebarGroup className={cn("py-1", collapsed ? "px-1.5" : "px-2")}>
            {!collapsed && (
              <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em]">
                Cadastros
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">{cadastrosVisiveis.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
