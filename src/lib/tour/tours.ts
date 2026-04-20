import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import type { AppRole } from "@/contexts/AuthContext";

/**
 * Mapa rota → passos do tour. Chaves devem bater com `useLocation().pathname`.
 * Use `data-tour="<id>"` nos elementos para servir de âncora.
 */
type TourConfig = {
  papel: AppRole | "qualquer";
  steps: DriveStep[];
};

const STORAGE_KEY = (userId: string, rota: string) => `tour_v1:${userId}:${rota}`;
const RESET_FLAG = "tour_v1:reset_at";

const COMUM_HEADER: DriveStep[] = [
  {
    element: '[data-tour="sidebar-trigger"]',
    popover: {
      title: "Menu lateral",
      description: "Clique aqui para mostrar ou esconder o menu de navegação.",
    },
  },
  {
    element: '[data-tour="ajuda-tour"]',
    popover: {
      title: "Reexibir dicas",
      description:
        "Sempre que precisar rever este passo a passo, clique aqui para reabrir as dicas em todas as telas.",
    },
  },
];

const TOURS: Record<string, TourConfig> = {
  // ===================== SOCIEDADE =====================
  "/painel/sociedade": {
    papel: "tesoureiro_sociedade",
    steps: [
      {
        popover: {
          title: "Bem-vindo(a) ao painel da sua sociedade 👋",
          description:
            "Aqui você acompanha o saldo, registra contribuições e solicita pagamentos. Vamos te mostrar o essencial.",
        },
      },
      ...COMUM_HEADER,
    ],
  },
  "/sociedade/contribuicoes": {
    papel: "tesoureiro_sociedade",
    steps: [
      {
        popover: {
          title: "Contribuições recebidas",
          description:
            "Registre cada contribuição de membro: valor, data, forma de pagamento e o comprovante (opcional).",
        },
      },
      {
        element: '[data-tour="acoes-pagina"]',
        popover: {
          title: "Nova contribuição",
          description:
            "Use este botão para lançar uma nova contribuição. Após a Tesouraria Central conferir, ela fica bloqueada para edição.",
        },
      },
    ],
  },
  "/sociedade/solicitacoes": {
    papel: "tesoureiro_sociedade",
    steps: [
      {
        popover: {
          title: "Solicitações de pagamento",
          description:
            "Crie pedidos de pagamento (fornecedor, valor, vencimento, nota anexa). Salve como rascunho e envie quando estiver pronto.",
        },
      },
      {
        element: '[data-tour="acoes-pagina"]',
        popover: {
          title: "Filtrar e criar",
          description:
            "Use o filtro de status para encontrar rapidamente. O botão verde cria uma nova solicitação.",
        },
      },
    ],
  },
  "/sociedade/extrato": {
    papel: "tesoureiro_sociedade",
    steps: [
      {
        popover: {
          title: "Seu extrato mensal",
          description:
            "Veja todas as movimentações do mês como um extrato bancário, com saldo acumulado linha a linha.",
        },
      },
      {
        element: '[data-tour="extrato-mes"]',
        popover: {
          title: "Mês de referência",
          description: "Mude o mês para consultar períodos anteriores.",
        },
      },
    ],
  },
  "/sociedade/fechamentos": {
    papel: "tesoureiro_sociedade",
    steps: [
      {
        popover: {
          title: "Fechamento mensal",
          description:
            "No fim do mês, gere o fechamento, confira os totais e envie para a Tesouraria Central conferir.",
        },
      },
      {
        element: '[data-tour="novo-fechamento"]',
        popover: {
          title: "Novo fechamento",
          description:
            "Cria o fechamento do mês escolhido. Você pode recalcular e enviar quando estiver tudo certo.",
        },
      },
    ],
  },

  // ===================== CENTRAL =====================
  "/painel/central": {
    papel: "tesoureiro_central",
    steps: [
      {
        popover: {
          title: "Painel da Tesouraria Central 👋",
          description:
            "Você acompanha tudo o que as sociedades lançam: confere contribuições, aprova pagamentos e revisa fechamentos.",
        },
      },
      ...COMUM_HEADER,
    ],
  },
  "/central/contribuicoes": {
    papel: "tesoureiro_central",
    steps: [
      {
        popover: {
          title: "Conferir contribuições",
          description:
            "Aqui aparecem todas as contribuições registradas pelas sociedades. Confira valor e comprovante antes de aprovar.",
        },
      },
      {
        element: '[data-tour="acoes-pagina"]',
        popover: {
          title: "Filtros",
          description: "Filtre por sociedade ou status para focar no que ainda está pendente.",
        },
      },
    ],
  },
  "/central/solicitacoes": {
    papel: "tesoureiro_central",
    steps: [
      {
        popover: {
          title: "Analisar solicitações",
          description:
            "Aprove ou recuse pedidos de pagamento. Quando aprovados e pagos, registre o pagamento — a saída entra automaticamente no extrato da sociedade.",
        },
      },
    ],
  },
  "/central/fechamentos": {
    papel: "tesoureiro_central",
    steps: [
      {
        popover: {
          title: "Conferir fechamentos",
          description:
            "Revise os fechamentos enviados pelas sociedades. Marque como conferido ou devolva para correção.",
        },
      },
    ],
  },

  // ===================== IGREJA =====================
  "/painel/igreja": {
    papel: "tesoureiro_igreja",
    steps: [
      {
        popover: {
          title: "Painel da Tesouraria da Igreja 👋",
          description:
            "Visão geral de todas as sociedades. Aqui você consolida o mês, gera relatórios e acompanha a auditoria.",
        },
      },
      ...COMUM_HEADER,
    ],
  },
  "/igreja/fechamentos": {
    papel: "tesoureiro_igreja",
    steps: [
      {
        popover: {
          title: "Consolidação mensal",
          description:
            "Quando todas as sociedades estão com fechamento conferido, consolide o mês — isso trava as movimentações para sempre.",
        },
      },
      {
        element: '[data-tour="igreja-baixar-pdf"]',
        popover: {
          title: "PDF oficial",
          description:
            "Baixe o fechamento de cada sociedade em PDF, com cabeçalho da igreja e linhas de assinatura.",
        },
      },
    ],
  },
  "/igreja/relatorios": {
    papel: "tesoureiro_igreja",
    steps: [
      {
        popover: {
          title: "Relatórios consolidados",
          description:
            "Filtre por período e sociedade. Cada aba (contribuições, pagamentos, movimentações, resumo) pode ser exportada para CSV.",
        },
      },
    ],
  },
  "/igreja/auditoria": {
    papel: "tesoureiro_igreja",
    steps: [
      {
        popover: {
          title: "Auditoria",
          description:
            "Histórico de tudo que aconteceu no sistema: criações, edições, exclusões e reaberturas. Filtre por módulo, ação ou usuário.",
        },
      },
    ],
  },
};

function getResetTimestamp(): number {
  const v = localStorage.getItem(RESET_FLAG);
  return v ? Number(v) || 0 : 0;
}

function jaViu(userId: string, rota: string): boolean {
  const key = STORAGE_KEY(userId, rota);
  const visto = localStorage.getItem(key);
  if (!visto) return false;
  const ts = Number(visto) || 0;
  return ts > getResetTimestamp();
}

function marcarVisto(userId: string, rota: string) {
  localStorage.setItem(STORAGE_KEY(userId, rota), String(Date.now()));
}

export function temTourPara(rota: string): boolean {
  return !!TOURS[rota];
}

export function iniciarTour(rota: string, opts?: { force?: boolean; userId?: string | null }) {
  const cfg = TOURS[rota];
  if (!cfg) return;
  const userId = opts?.userId ?? "anon";

  if (!opts?.force && jaViu(userId, rota)) return;

  const steps = cfg.steps.filter((s) => {
    if (!s.element) return true;
    return !!document.querySelector(s.element as string);
  });
  if (steps.length === 0) return;

  const d = driver({
    showProgress: true,
    allowClose: true,
    overlayOpacity: 0.5,
    nextBtnText: "Próximo →",
    prevBtnText: "← Voltar",
    doneBtnText: "Entendi",
    progressText: "{{current}} de {{total}}",
    onDestroyStarted: () => {
      marcarVisto(userId, rota);
      d.destroy();
    },
    steps,
  });
  d.drive();
}

export function reexibirTodosTours() {
  localStorage.setItem(RESET_FLAG, String(Date.now()));
}
