
# Reformulação visual completa — Tesouraria Presbiteriana

Aplicar todo o brief de identidade visual, layout, tabelas, gráficos, formulários, modais, fechamentos, relatórios, responsividade e acessibilidade — em uma única rodada — preservando todas as regras de negócio, Supabase, RLS, anexos, auditoria, fechamentos, PIN e botão de atualização. Como só você usa o sistema, **ignoro a separação por perfis** descrita no brief: as listas de itens de sidebar por papel (Administrador / Central / Sociedade) viram **um único menu unificado** dentro do `ShellPainel` atual, com o seletor global de sociedade já existente.

## 1. Limpeza técnica (antes do visual)

- Consolidar `ContribuicoesComLote.tsx` em `Contribuicoes.tsx` preservando seleção em massa e conferência em lote.
- Consolidar `SolicitacoesEditaveis.tsx` em `Solicitacoes.tsx` e `FormSolicitacaoEditavel.tsx` no `FormSolicitacao.tsx`, mantendo as regras de status (rascunho/enviada editáveis; em_analise/aprovada/paga bloqueadas).
- Unificar hooks editáveis nos hooks canônicos (`useSolicitacoesSociedade`, `useContribuicoesSociedade`).
- Remover aliases específicos de páginas no `vite.config.ts`, manter apenas `@`.
- Atualizar imports em `App.tsx`, apagar os arquivos `*ComLote.tsx`, `*Editaveis.tsx`, `FormSolicitacaoEditavel.tsx` e hooks órfãos.

## 2. Identidade visual

**Conceito:** institucional, sóbrio, transparente. Sem glassmorphism, sem degradês fortes, sem sombras pesadas, sem cores saturadas.

**Paleta (em `src/index.css` como tokens HSL semânticos, mapeados também no `tailwind.config.ts`):**

```
navy-950 #0b1d33   navy-900 #102744   navy-800 #16345d   navy-700 #1d4072
gold-600 #c89624   gold-500 #d2a93b   gold-400 #e1bd5a
surface  #f5f7fa   card #ffffff       border  #dfe5ec
text     #182538   muted #64748b
success #198754  warning #d97706  danger #c2414b  info #2563a6
```

**Tipografia:** Inter via `@fontsource/inter` importado em `src/main.tsx`, configurado em `tailwind.config.ts`. Números financeiros com `font-variant-numeric: tabular-nums` (classe utilitária `tabular-nums`).

**Hierarquia:** título 24–28/700, seção 18–20/650, card 13–14/600, valor 24–30/700, corpo 14, auxiliar 12–13.

**Bordas:** cards 12px, botões/inputs 8–10px, badges pill, sidebar ativa 10px.
**Sombras:** apenas `--shadow-card` e `--shadow-elevated` (suaves).
**Espaçamento:** múltiplos de 4 (4/8/12/16/20/24/32/40).
**Largura máxima do conteúdo:** 1720px, padding responsivo 16/20/24/32.

## 3. Logotipo

Criar `src/components/brand/LogoTesouraria.tsx` em **SVG vetorial próprio** combinando contorno de igreja + 3 barras verticais (gráfico financeiro) + cruz/porta central discreta. Props: `variant` (`horizontal | vertical | icon`), `theme` (`light | dark | monochrome`), `size` (`sm | md | lg`). Usado na sidebar, no login e no PIN. O ícone `Church` do Lucide continua só em menus internos.

## 4. Shell, Sidebar e Topbar

Refatorar `ShellPainel.tsx` + `SidebarPainel.tsx`:

- Sidebar expandida (240–260px) navy-900 com texto claro; recolhida (68–76px) só com ícones e logo símbolo.
- Trigger sempre visível no topbar.
- Menu único (operador único), agrupado: **Visão geral** (Painel, Extrato) · **Operação** (Entradas, Pagamentos, Fechamentos) · **Igreja** (Relatórios, Auditoria) · **Cadastros** (Sociedades, Usuários, Categorias, Fornecedores, Configurações da igreja).
- Topbar com: logo abreviado em mobile, seletor global de sociedade, botão Atualizar, botão Travar (PIN), avatar.
- Mobile: menu off-canvas, título abreviado.

## 5. Telas — repaginar mantendo regras

Aplicar o novo design system em todas as telas listadas, sem mexer em lógica:

- **Login & PIN:** fundo `surface`, logo no topo, formulário centralizado largura confortável, sem painel lateral.
- **Painel do Administrador (`/painel/administrador`):** cards de saldo consolidado / entradas / saídas / pendências; gráfico de barras por sociedade (Recharts) com cores tokenizadas; lista de pendências acionáveis; estado vazio elegante.
- **Painel Central / Igreja / Sociedade:** mesmo `ShellPainel`, mesmos tokens, sem layouts paralelos.
- **Entradas (`/sociedade/contribuicoes`):** barra com pesquisa + filtros (sociedade/status/período) + ação "Nova entrada"; tabela desktop, cards em mobile; conferência em lote preservada.
- **Pagamentos (`/sociedade/solicitacoes`):** mesma estrutura; formulário em modal com validação Zod, anexos múltiplos (até 2 comprovantes + 2 recibos já existentes), bloqueio de mês consolidado com mensagem explicativa.
- **Extrato:** tabela cronológica desktop, lista vertical mobile, filtros padronizados.
- **Conferência Central / Pagamentos Central:** indicadores no topo, ações preservadas (iniciar análise, aprovar, recusar, pagar), drawer para detalhes extensos.
- **Cadastros (Sociedades, Usuários, Categorias, Fornecedores):** tabelas padronizadas, formulários agrupados em seções, confirmação destrutiva em vermelho.
- **Relatórios:** filtros (período/sociedade/categoria/tipo/status) com Aplicar/Limpar; resumo + tabela; sem cabeçalho azul gigante.
- **Auditoria:** filtros por período/tipo de ação; tabela compacta; modal de detalhes mantido.
- **Fechamentos (sociedade / central / igreja):** cards de status no topo, tabela por sociedade (entradas/saídas/saldo), avisos de mês consolidado, ações preservadas; PDF mantém estrutura atual (saldos por sociedade abaixo do resumo + seletor geral/por sociedade).

## 6. Tabelas, Modais, Drawers, Feedback

- Tabela padrão: cabeçalho `surface`, linhas zebra suaves, hover, paginação consistente, valores monetários alinhados à direita com `tabular-nums`.
- Badges de status com cores semânticas (rascunho cinza / enviada azul / em análise âmbar / aprovada verde-claro / paga verde / recusada vermelho · conferência: pendente âmbar / conferida verde / divergente vermelho).
- Modais: ação principal à direita, destrutiva vermelha, loading + bloqueio de duplo envio, não fechar em erro.
- Drawers laterais para detalhes longos (solicitação, contribuição, auditoria).
- Toasts via `sonner` já existente — não duplicar com modais.

## 7. Responsividade e acessibilidade

- Breakpoints: mobile <640, tablet 640–1023, desktop ≥1024, wide ≥1440.
- Mobile: sidebar off-canvas, tabelas viram cards, botões com área de toque ≥44px.
- WCAG AA: contraste verificado nos tokens; foco visível em todos interativos; `aria-label` em botões só com ícone; labels associadas a inputs; navegação por teclado em modais/drawers.

## 8. Preservado integralmente

Supabase, RLS, autenticação, PIN (010203), botão Atualizar, anexos múltiplos, auditoria, fechamentos com triggers de mês consolidado, cálculos de saldo, edição/exclusão por status, tours, mensagens de erro/validação, dados reais — **nenhum dado fictício será inserido**.

## Seção técnica

- Novos arquivos: `src/components/brand/LogoTesouraria.tsx`, possíveis `src/components/ui/page-header.tsx`, `src/components/ui/data-toolbar.tsx`, `src/components/ui/stat-card.tsx`.
- Tokens em `src/index.css` (variáveis CSS HSL) + mapeamento em `tailwind.config.ts` (`colors.brand.*`, `boxShadow.card/elevated`, `borderRadius`, `fontFamily.sans = ['Inter', ...]`).
- Instalar: `bun add @fontsource/inter` e importar em `src/main.tsx`.
- Refatorar consumidores que usam cores hardcoded (`text-white`, `bg-[#...]`) trocando por classes semânticas (`text-foreground`, `bg-card`, `border-border`, `text-brand-navy-900`, etc.).
- Recharts: paleta única derivada dos tokens, sem cores avulsas espalhadas.
- Remoção segura dos arquivos duplicados só após `App.tsx` apontar para os canônicos e tipos compilarem.

## Fora de escopo

- Não criar nova biblioteca de componentes paralela ao shadcn.
- Não recriar fluxos do zero.
- Não inserir dados de exemplo, não tocar em migrations/RLS/políticas.
- Não reintroduzir múltiplos perfis de usuário.
