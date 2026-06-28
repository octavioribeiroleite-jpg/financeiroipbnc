import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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

const ROTULO_PAPEL: Record<AppRole, string> = {
  administrador: "Administrador",
  tesoureiro_igreja: "Tesoureiro da Igreja",
  tesoureiro_central: "Tesoureiro Central",
  tesoureiro_sociedade: "Tesoureiro da Sociedade",
};

const MENU_ADMIN: GrupoMenu[] = [
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

function iniciais(nome?: string | null) {
  if (!nome?.trim()) return "TP";
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

export function SidebarPainel() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { papelPrincipal, perfil } = useAuth();
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
            "relative h-10 rounded-[10px] px-3 transition-all duration-200",
            "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            "group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0",
            "group-data-[collapsible=icon]:justify-center",
            active && "bg-sidebar-accent text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border/60",
          )}
        >
          <NavLink to={item.url} end className={cn("flex h-full w-full items-center gap-3", collapsed && "justify-center")}>
            {active && !collapsed && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-sidebar-primary" />}
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
      <SidebarHeader className="h-20 border-b border-sidebar-border/70 p-0">
        <div className={cn("flex h-full w-full items-center transition-all duration-200", collapsed ? "justify-center" : "px-4")}>
          <LogoTesouraria variant={collapsed ? "icon" : "horizontal"} theme="dark" size={collapsed ? "md" : "lg"} />
        </div>
      </SidebarHeader>

      <SidebarContent className="py-3">
        {grupos.map((grupo, indice) => (
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

      <SidebarFooter className={cn("border-t border-sidebar-border/70", collapsed ? "p-2" : "p-3")}>
        {collapsed ? (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground" title={perfil?.nome ?? "Usuário"}>
            {iniciais(perfil?.nome)}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-white/5 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
              {iniciais(perfil?.nome)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">{perfil?.nome ?? "Usuário"}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {papelPrincipal ? ROTULO_PAPEL[papelPrincipal] : "Sem papel"}
              </p>
            </div>
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
