# ETAPA 4 — Painel da Sociedade: Contribuições e Solicitações de Pagamento

## Objetivo da etapa
Construir o painel operacional para o **tesoureiro da sociedade**, permitindo o registro de contribuições recebidas e a criação de solicitações de pagamento para a tesouraria central. Esta é a interface de trabalho diário da sociedade.

---

## 1. Visão geral do fluxo da sociedade

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESOUREIRO DA SOCIEDADE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────────┐                    │
│  │ CONTRIBUIÇÕES│      │ SOLICITAÇÕES DE  │                    │
│  │              │      │ PAGAMENTO        │                    │
│  │ • Registrar  │      │                  │                    │
│  │   entrada    │      │ • Criar pedido   │                    │
│  │ • Anexar     │      │ • Anexar nota    │                    │
│  │   comprovante│      │ • Enviar para    │                    │
│  │ • Ver status │      │   análise        │                    │
│  │   de         │      │ • Acompanhar     │                    │
│  │   conferência│      │   status         │                    │
│  └──────────────┘      └──────────────────┘                    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    VISÃO FINANCEIRA                      │    │
│  │                                                          │    │
│  │  • Saldo atual (entradas - saídas confirmadas)          │    │
│  │  • Total de contribuições no mês                        │    │
│  │  • Total de pagamentos aprovados no mês                  │    │
│  │  • Solicitações pendentes de envio                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Páginas a serem construídas

### 2.1 Painel da Sociedade (resumo)
**Arquivo:** `src/pages/painel/Sociedade.tsx` (substituir o atual "Em construção")

**Conteúdo:**
- Cards de resumo financeiro:
  - Saldo atual da sociedade
  - Contribuições do mês atual
  - Pagamentos aprovados no mês
  - Solicitações pendentes de envio
- Tabela rápida das últimas 5 contribuições
- Tabela rápida das últimas 5 solicitações
- Botões de ação: "Nova Contribuição", "Nova Solicitação"

### 2.2 Contribuições da Sociedade
**Arquivo:** `src/pages/sociedade/Contribuicoes.tsx`

**Conteúdo:**
- Listagem completa de contribuições da sociedade
- Filtros: período (mês/ano), status de conferência, membro
- Busca por nome do membro
- Colunas: membro, referência, valor, data, forma, status conferência
- Ações: visualizar, editar (se pendente), excluir (se pendente)
- Botão "Nova Contribuição" → abre modal de criação

### 2.3 Nova/Editar Contribuição (modal)
**Componente:** `src/components/sociedade/FormContribuicao.tsx`

**Campos:**
- Membro (texto livre, autocomplete com nomes anteriores)
- Referência mês (date picker, default mês atual)
- Valor (currency input)
- Data do pagamento (date picker, default hoje)
- Forma de pagamento (select: Dinheiro, PIX, Transferência, Cartão, Outro)
- Comprovante (upload de arquivo → bucket "anexos")
- Observação (textarea opcional)

**Regras:**
- Valor > 0
- Data pagamento ≤ hoje
- Referência mês no formato YYYY-MM

### 2.4 Solicitações de Pagamento
**Arquivo:** `src/pages/sociedade/Solicitacoes.tsx`

**Conteúdo:**
- Listagem de solicitações da sociedade
- Filtros: status, período, fornecedor
- Colunas: descrição, fornecedor, valor, vencimento, status
- Ações: visualizar, editar (rascunho/enviada), enviar para análise, cancelar
- Botão "Nova Solicitação"

### 2.5 Nova/Editar Solicitação (modal)
**Componente:** `src/components/sociedade/FormSolicitacao.tsx`

**Campos:**
- Fornecedor (select com busca, vindo do cadastro)
- Descrição (texto)
- Categoria (select, vindo do cadastro)
- Valor (currency input)
- Vencimento (date picker)
- Observações (textarea)
- Anexo da nota fiscal (upload → bucket "anexos")

**Regras:**
- Valor > 0
- Vencimento ≥ hoje
- Fornecedor obrigatório

### 2.6 Visualizar Solicitação (modal)
**Componente:** `src/components/sociedade/ViewSolicitacao.tsx`

**Conteúdo:**
- Timeline do fluxo: Criada → Enviada → Em análise → Aprovada/Recusada → Paga
- Dados completos da solicitação
- Quem criou, quando foi enviada, quem conferiu
- Comprovante de pagamento (quando paga)
- Motivo da recusa (quando recusada)

---

## 3. Componentes reutilizáveis a criar

### 3.1 ResumoFinanceiro
Cards de métricas financeiras com ícones e variação percentual.

### 3.2 TimelineStatus
Visualização do progresso de uma solicitação com etapas conectadas.

### 3.3 UploadAnexo
Componente de upload com drag-and-drop, preview e validação de tipo/tamanho.

### 3.4 CurrencyInput
Input de valor monetário com máscara de moeda brasileira (R$).

### 3.5 MonthPicker
Seletor de mês/ano para referência de contribuições.

---

## 4. Hooks personalizados

### 4.1 useResumoSociedade
Retorna métricas calculadas da sociedade:
- saldoAtual
- contribuicoesMes
- pagamentosMes
- solicitacoesPendentes

### 4.2 useContribuicoesSociedade
CRUD de contribuições com filtros e paginação.

### 4.3 useSolicitacoesSociedade
CRUD de solicitações com filtros por status.

### 4.4 useUploadAnexo
Gerencia upload de arquivos para o bucket "anexos".

---

## 5. Regras de negócio importantes

### Contribuições
- Tesoureiro da sociedade pode criar, editar e excluir contribuições **pendentes de conferência**.
- Após conferência (feita pelo central), a contribuição fica **imutável**.
- Cada contribuição gera automaticamente uma movimentação de entrada na tabela `movimentacoes_sociedade`.

### Solicitações de Pagamento
- Fluxo de status: **Rascunho → Enviada → Em análise → Aprovada/Recusada → Paga**.
- Tesoureiro da sociedade pode criar e editar enquanto estiver em **rascunho** ou **enviada**.
- Após aprovação, apenas o central pode registrar o pagamento.
- Solicitações **pagas não podem ser excluídas**.
- Quando paga, gera automaticamente uma movimentação de saída.

### Permissões
- Tesoureiro da sociedade **só enxerga dados da própria sociedade**.
- Não pode ver contribuições, solicitações ou saldos de outras sociedades.
- Isso é garantido pelas RLS policies já criadas na Etapa 1.

---

## 6. O que será entregue

### Páginas
- `src/pages/painel/Sociedade.tsx` — Dashboard com resumo financeiro
- `src/pages/sociedade/Contribuicoes.tsx` — Listagem de contribuições
- `src/pages/sociedade/Solicitacoes.tsx` — Listagem de solicitações

### Componentes
- `src/components/sociedade/FormContribuicao.tsx`
- `src/components/sociedade/FormSolicitacao.tsx`
- `src/components/sociedade/ViewSolicitacao.tsx`
- `src/components/sociedade/ResumoFinanceiro.tsx`
- `src/components/sociedade/TimelineStatus.tsx`
- `src/components/shared/UploadAnexo.tsx`
- `src/components/shared/CurrencyInput.tsx`
- `src/components/shared/MonthPicker.tsx`

### Hooks
- `src/hooks/sociedade/useResumoSociedade.ts`
- `src/hooks/sociedade/useContribuicoesSociedade.ts`
- `src/hooks/sociedade/useSolicitacoesSociedade.ts`
- `src/hooks/shared/useUploadAnexo.ts`

### Rotas (adicionadas em App.tsx)
- `/painel/sociedade` → tesoureiro_sociedade
- `/sociedade/contribuicoes` → tesoureiro_sociedade
- `/sociedade/solicitacoes` → tesoureiro_sociedade

### Atualizações
- `SidebarPainel.tsx` — adicionar itens de menu para tesoureiro_sociedade

---

## 7. O que **NÃO** será feito nesta etapa

- Painel da Tesouraria Central (conferência, aprovação, pagamento) — Etapa 5
- Painel da Igreja (visão consolidada) — Etapa 6
- Fechamentos mensais — Etapa 7
- Relatórios detalhados — Etapa 8
- Notificações por e-mail — etapa futura

---

## Próximas etapas (visão geral)
- **Etapa 5** — Painel da Tesouraria Central: conferência, aprovação e pagamento.
- **Etapa 6** — Painel da Igreja: visão consolidada e auditoria.
- **Etapa 7** — Fechamentos mensais e relatórios.
- **Etapa 8** — Refinamentos finais, exportações e auditoria detalhada.

---

**Aguardando sua aprovação para executar a Etapa 4.**
