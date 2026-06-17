## Objetivo
Aplicar as melhorias sugeridas no resumo, deixando o app totalmente alinhado ao uso individual com o seletor global de sociedade.

## Escopo desta entrega

### 1. Fechamentos por sociedade ativa
- Ajustar `src/pages/sociedade/Fechamentos.tsx` para usar `sociedadeSelecionadaId` do `SociedadeOperacionalContext` em vez do `sociedadeId` do `useAuth`.
- Garantir que criar, recalcular, conferir e consolidar respeitem a sociedade ativa.
- Tornar essa tela o ponto único de fechamento por sociedade.

### 2. Unificação das telas de fechamento
- Manter apenas uma rota operacional de fechamento (`/sociedade/fechamentos`), agora dirigida pela sociedade ativa.
- Remover do menu as entradas duplicadas de fechamento (`/central/fechamentos` e `/igreja/fechamentos`).
- Manter as rotas no `App.tsx` por enquanto (sem quebrar links antigos), apenas escondidas da navegação.

### 3. Dashboard sensível à sociedade ativa
- Em `src/pages/painel/Administrador.tsx`, trocar hooks centralizados (`useContribuicoesCentral`, `useSolicitacoesCentral`) por hooks filtrados pela sociedade ativa.
- Cards exibirão: saldo da sociedade ativa, contribuições do mês, pagamentos em aberto, status do fechamento do mês corrente.
- Adicionar um indicador no topo mostrando a sociedade atualmente selecionada.
- Quando nenhuma sociedade estiver selecionada, mostrar visão consolidada como fallback.

### 4. Sidebar plana
- Em `src/components/painel/SidebarPainel.tsx`, eliminar os agrupamentos antigos (Lançamentos, Processamento, Fechamentos e relatórios).
- Lista única e direta: Painel, Contribuições, Pagamentos, Fechamentos, Extrato, Relatórios, Administração.

## Fora do escopo
- Remoção de tabelas, policies ou rotas legadas no banco.
- Mudanças no fluxo de aprovação/pagamento (já unificado).
- Redesign visual.

## Resultado esperado
- Um único fluxo de fechamento mensal, sempre pela sociedade ativa no seletor global.
- Painel inicial mostrando dados reais da sociedade selecionada.
- Menu lateral mais curto e direto.
- Nenhuma quebra de dados existentes.
